import mysql.connector
import uuid
from datetime import datetime, timedelta

def check_unusual_amount(conn, account_number, new_amount):
    """
    Checks if the transaction amount is unusually large compared to the historical average.
    Returns (True, 40) if amount > 3 * average, else (False, 0).
    """
    try:
        cursor = conn.cursor()
        # Query last 10 transactions for this account (Completed ones usually make sense, but will check all)
        cursor.execute('''
            SELECT amount FROM `transaction`
            WHERE account_number = %s
            ORDER BY date_time DESC
            LIMIT 10
        ''', (account_number,))
        
        amounts = [row[0] for row in cursor.fetchall()]
        
        if not amounts:
            return False, 0
            
        avg_amount = sum(amounts) / len(amounts)
        
        if avg_amount > 0 and new_amount > (avg_amount * 3):
            return True, 40
            
        return False, 0
    except mysql.connector.Error as e:
        print(f"Error in check_unusual_amount: {e}")
        return False, 0

def check_rapid_transactions(conn, account_number, current_time_str):
    """
    Checks if there are > 3 transactions in the last 5 minutes.
    Returns (True, 30) if count > 3, else (False, 0).
    """
    try:
        # Parse current time
        current_time = datetime.strptime(current_time_str, '%Y-%m-%d %H:%M:%S')
        five_mins_ago = current_time - timedelta(minutes=5)
        five_mins_ago_str = five_mins_ago.strftime('%Y-%m-%d %H:%M:%S')

        cursor = conn.cursor()
        cursor.execute('''
            SELECT COUNT(*) FROM `transaction`
            WHERE account_number = %s 
            AND date_time >= %s 
            AND date_time <= %s
        ''', (account_number, five_mins_ago_str, current_time_str))
        
        count = cursor.fetchone()[0]
        
        if count > 3:
            return True, 30
            
        return False, 0
    except Exception as e:
        print(f"Error in check_rapid_transactions: {e}")
        return False, 0

def check_blacklisted_location(conn, ip_address, city_country):
    """
    Checks if IP or location is blacklisted.
    Returns (True, 50) if found, else (False, 0).
    """
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT COUNT(*) FROM blacklist
            WHERE blocked_value = %s OR blocked_value = %s
        ''', (ip_address, city_country))
        
        count = cursor.fetchone()[0]
        
        if count > 0:
            return True, 50
            
        return False, 0
    except mysql.connector.Error as e:
        print(f"Error in check_blacklisted_location: {e}")
        return False, 0

def run_fraud_checks(conn, transaction_id, account_number, amount, date_time, ip_address, city_country):
    """
    Runs all fraud checks and updates database.
    """
    total_score = 0
    rules_fired = []
    
    # 1. Unusual Amount
    is_unusual, score = check_unusual_amount(conn, account_number, amount)
    if is_unusual:
        total_score += score
        rules_fired.append("Unusual Amount")
        
    # 2. Rapid Transactions
    is_rapid, score = check_rapid_transactions(conn, account_number, date_time)
    if is_rapid:
        total_score += score
        rules_fired.append("Rapid Transactions")
        
    # 3. Blacklisted Location
    is_blacklisted, score = check_blacklisted_location(conn, ip_address, city_country)
    if is_blacklisted:
        total_score += score
        rules_fired.append("Blacklisted Location")
        
    # Determine final status
    if total_score == 0:
        final_status = "COMPLETED"
    elif total_score < 70:
        final_status = "FLAGGED"
    else:
        final_status = "BLOCKED"
        
    try:
        cursor = conn.cursor()
        
        # Update transaction status
        cursor.execute('''
            UPDATE `transaction`
            SET status_code = %s
            WHERE transaction_id = %s
        ''', (final_status, transaction_id))
        
        # Update account risk level if blocked
        if final_status == "BLOCKED":
            cursor.execute('''
                UPDATE account_details
                SET risk_level = 'HIGH'
                WHERE account_number = %s
            ''', (account_number,))
            
        # Create alert if any rules fired
        alert_id = None
        if rules_fired:
            alert_id = "ALT" + str(uuid.uuid4()).split('-')[0].upper()
            cursor.execute('''
                INSERT IGNORE INTO fraud_alert (alert_id, transaction_id, account_number, risk_score, alert_status, rules_fired)
                VALUES (%s, %s, %s, %s, 'OPEN', %s)
            ''', (alert_id, transaction_id, account_number, total_score, ", ".join(rules_fired)))
            
        conn.commit()
        
        return {
            "rules_fired": rules_fired,
            "total_score": total_score,
            "final_status": final_status,
            "alert_id": alert_id
        }
        
    except mysql.connector.Error as e:
        print(f"Error updating DB with fraud check results: {e}")
        conn.rollback()
        return {
            "rules_fired": rules_fired,
            "total_score": total_score,
            "final_status": "ERROR",
            "alert_id": None
        }
