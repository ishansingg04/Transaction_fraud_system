from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import sqlite3
import uuid
from datetime import datetime
from fraud_engine import run_fraud_checks

app = Flask(__name__)
CORS(app)
DB_NAME = 'fraud_detection.db'

# TODO: replace with MySQL connection when deploying
def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) FROM "transaction"')
    total_txns = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM fraud_alert WHERE alert_status = "OPEN"')
    open_alerts = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM account_details WHERE risk_level = "HIGH"')
    blocked_accounts = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM "transaction" WHERE status_code = "FLAGGED"')
    flagged_txns = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM "transaction" WHERE status_code = "BLOCKED"')
    blocked_txns = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM "transaction" WHERE status_code = "COMPLETED"')
    completed_txns = cursor.fetchone()[0]
    
    # recent 10 transactions
    cursor.execute('''
        SELECT t.transaction_id, a.account_name, t.amount, t.transaction_type, t.date_time, t.status_code 
        FROM "transaction" t
        JOIN account_details a ON t.account_number = a.account_number
        ORDER BY t.date_time DESC
        LIMIT 10
    ''')
    recent_txns = [dict(row) for row in cursor.fetchall()]
    
    # active alerts
    cursor.execute('''
        SELECT f.alert_id, a.account_name, f.risk_score, f.rules_fired, f.alert_status
        FROM fraud_alert f
        JOIN account_details a ON f.account_number = a.account_number
        WHERE f.alert_status = "OPEN"
        ORDER BY f.risk_score DESC
        LIMIT 5
    ''')
    active_alerts = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify({
        'total_txns': total_txns,
        'open_alerts': open_alerts,
        'blocked_accounts': blocked_accounts,
        'flagged_txns': flagged_txns,
        'blocked_txns': blocked_txns,
        'completed_txns': completed_txns,
        'recent_txns': recent_txns,
        'active_alerts': active_alerts
    })

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT t.*, a.account_name, l.ip_address, l.city_country 
        FROM "transaction" t
        JOIN account_details a ON t.account_number = a.account_number
        LEFT JOIN location l ON t.location_id = l.location_id
        ORDER BY t.date_time DESC
    ''')
    transactions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(transactions)

@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    data = request.json
    account_number = data.get('account_number')
    amount = float(data.get('amount'))
    transaction_type = data.get('transaction_type')
    ip_address = data.get('ip_address')
    city_country = data.get('city_country')
    date_time = data.get('date_time', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    
    transaction_id = "TXN" + str(uuid.uuid4()).split('-')[0].upper()
    location_id = "LOC" + str(uuid.uuid4()).split('-')[0].upper()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # First, query current balance and risk
        cursor.execute("SELECT account_balance, risk_level FROM account_details WHERE account_number = ?", (account_number,))
        account = cursor.fetchone()
        
        if not account:
            return jsonify({"error": "Account not found"}), 404
            
        if account['risk_level'] == 'HIGH' or transaction_type == 'DEBIT' and account['account_balance'] < amount:
            pass # Maybe reject outright? But let's proceed with inserting to log it and let the system flag/block it.
        
        # Insert location
        cursor.execute("INSERT INTO location (location_id, ip_address, city_country, is_known_proxy) VALUES (?, ?, ?, ?)",
                       (location_id, ip_address, city_country, 0))
                       
        # Insert transaction as PENDING initially
        cursor.execute('''
            INSERT INTO "transaction" (transaction_id, account_number, amount, date_time, transaction_type, status_code, location_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (transaction_id, account_number, amount, date_time, transaction_type, 'PENDING', location_id))
        
        conn.commit()
        
        # Run fraud checks (this will update transaction status, create alerts, and update risk level)
        result = run_fraud_checks(conn, transaction_id, account_number, amount, date_time, ip_address, city_country)
        
        if result['final_status'] in ['COMPLETED', 'FLAGGED']:
             # Update balance if it's a debit or credit that actually went through
             new_balance = account['account_balance']
             if transaction_type in ['DEBIT', 'TRANSFER']:
                 new_balance -= amount
             elif transaction_type == 'CREDIT':
                 new_balance += amount
                 
             cursor.execute("UPDATE account_details SET account_balance = ? WHERE account_number = ?", (new_balance, account_number))
             conn.commit()

        return jsonify(result)

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT f.alert_id, a.account_name, a.account_number, t.amount, t.transaction_id, 
               f.risk_score, f.rules_fired, f.alert_status, l.city_country, l.ip_address
        FROM fraud_alert f
        JOIN "transaction" t ON f.transaction_id = t.transaction_id
        JOIN account_details a ON f.account_number = a.account_number
        LEFT JOIN location l ON t.location_id = l.location_id
        ORDER BY f.alert_status DESC, f.risk_score DESC
    ''')
    alerts = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(alerts)

@app.route('/api/alerts/<alert_id>/resolve', methods=['POST'])
def resolve_alert(alert_id):
    data = request.json
    resolution = data.get('resolution')  # 'false_positive' or 'confirm_fraud'
    blacklist_location = data.get('blacklist_location', False)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get alert details first
        cursor.execute('''
            SELECT f.transaction_id, f.account_number, l.ip_address, l.city_country 
            FROM fraud_alert f
            JOIN "transaction" t ON f.transaction_id = t.transaction_id
            LEFT JOIN location l ON t.location_id = l.location_id
            WHERE f.alert_id = ?
        ''', (alert_id,))
        alert = cursor.fetchone()
        
        if not alert:
            return jsonify({"error": "Alert not found"}), 404
            
        # Update alert status
        cursor.execute("UPDATE fraud_alert SET alert_status = 'CLOSED' WHERE alert_id = ?", (alert_id,))
        
        if resolution == 'false_positive':
            # Unblock account and transaction
            cursor.execute("""UPDATE "transaction" SET status_code = 'COMPLETED' WHERE transaction_id = ?""", (alert['transaction_id'],))
            cursor.execute("UPDATE account_details SET risk_level = 'LOW' WHERE account_number = ?", (alert['account_number'],))
        elif resolution == 'confirm_fraud':
            # Leave as is, maybe ensure it's blocked
            cursor.execute("""UPDATE "transaction" SET status_code = 'BLOCKED' WHERE transaction_id = ?""", (alert['transaction_id'],))
            cursor.execute("UPDATE account_details SET risk_level = 'HIGH' WHERE account_number = ?", (alert['account_number'],))
            
            if blacklist_location and alert['ip_address']:
                blacklist_id = "BL" + str(uuid.uuid4()).split('-')[0].upper()
                cursor.execute("INSERT OR IGNORE INTO blacklist (blacklist_id, blocked_value, reason_code, date_added) VALUES (?, ?, ?, ?)",
                               (blacklist_id, alert['ip_address'], 'Confirmed Fraud IP', datetime.now().strftime('%Y-%m-%d')))
                               
        conn.commit()
        return jsonify({"success": True, "message": f"Alert {alert_id} resolved as {resolution}"})
        
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/accounts', methods=['GET'])
def get_accounts():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT account_number, account_name, account_balance, risk_level FROM account_details')
    accounts = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(accounts)

@app.route('/api/blacklist', methods=['GET'])
def get_blacklist():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM blacklist ORDER BY date_added DESC')
    blacklist = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(blacklist)

@app.route('/api/blacklist', methods=['POST'])
def add_blacklist():
    data = request.json
    blocked_value = data.get('blocked_value')
    reason_code = data.get('reason_code')
    
    if not blocked_value or not reason_code:
        return jsonify({"error": "Missing required fields"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        blacklist_id = "BL" + str(uuid.uuid4()).split('-')[0].upper()
        date_added = datetime.now().strftime('%Y-%m-%d')
        cursor.execute("INSERT INTO blacklist (blacklist_id, blocked_value, reason_code, date_added) VALUES (?, ?, ?, ?)",
                       (blacklist_id, blocked_value, reason_code, date_added))
        conn.commit()
        return jsonify({"success": True, "id": blacklist_id})
    except sqlite3.IntegrityError:
        return jsonify({"error": "Value already exists"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/blacklist/<blacklist_id>', methods=['DELETE'])
def delete_blacklist(blacklist_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM blacklist WHERE blacklist_id = ?", (blacklist_id,))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True)
