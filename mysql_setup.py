import mysql.connector

def setup_database():
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='IshanSingh0404'
        )
        cursor = conn.cursor()
        
        cursor.execute("CREATE DATABASE IF NOT EXISTS fraud_detection")
        cursor.execute("USE fraud_detection")
        
        # 1. account_details
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS account_details (
                account_number VARCHAR(255) PRIMARY KEY,
                account_name VARCHAR(255),
                user_id VARCHAR(255) UNIQUE,
                account_balance DOUBLE,
                risk_level ENUM('LOW','MEDIUM','HIGH'),
                account_pwd VARCHAR(255)
            )
        """)

        # 2. status
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS status (
                status_code VARCHAR(255) PRIMARY KEY,
                status_name VARCHAR(255)
            )
        """)

        # 3. location
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS location (
                location_id VARCHAR(255) PRIMARY KEY,
                ip_address VARCHAR(255),
                city_country VARCHAR(255),
                is_known_proxy TINYINT(1)
            )
        """)

        # 4. transaction
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS `transaction` (
                transaction_id VARCHAR(255) PRIMARY KEY,
                account_number VARCHAR(255),
                amount DOUBLE,
                date_time DATETIME,
                transaction_type VARCHAR(255),
                status_code VARCHAR(255),
                location_id VARCHAR(255),
                FOREIGN KEY (account_number) REFERENCES account_details(account_number),
                FOREIGN KEY (status_code) REFERENCES status(status_code),
                FOREIGN KEY (location_id) REFERENCES location(location_id)
            )
        """)

        # 5. fraud_alert
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS fraud_alert (
                alert_id VARCHAR(255) PRIMARY KEY,
                transaction_id VARCHAR(255),
                account_number VARCHAR(255),
                risk_score INT,
                alert_status ENUM('OPEN','CLOSED'),
                rules_fired VARCHAR(255),
                FOREIGN KEY (transaction_id) REFERENCES `transaction`(transaction_id),
                FOREIGN KEY (account_number) REFERENCES account_details(account_number)
            )
        """)

        # 6. blacklist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS blacklist (
                blacklist_id VARCHAR(255) PRIMARY KEY,
                blocked_value VARCHAR(255),
                reason_code VARCHAR(255),
                date_added DATE
            )
        """)
        
        # Seeding
        status_data = [
            ('PENDING', 'Pending'),
            ('COMPLETED', 'Completed'),
            ('FLAGGED', 'Flagged'),
            ('BLOCKED', 'Blocked')
        ]
        cursor.executemany("INSERT IGNORE INTO status (status_code, status_name) VALUES (%s, %s)", status_data)

        account_data = [
            ('ACC001', 'Rahul Sharma', 'user_rs', 45000, 'LOW', 'pwd123'),
            ('ACC002', 'Priya Mehta', 'user_pm', 120000, 'HIGH', 'pwd123'),
            ('ACC003', 'Aman Khan', 'user_ak', 8500, 'MEDIUM', 'pwd123'),
            ('ACC004', 'Sneha Patel', 'user_sp', 200000, 'LOW', 'pwd123'),
            ('ACC005', 'Rohit Verma', 'user_rv', 15000, 'HIGH', 'pwd123')
        ]
        cursor.executemany("INSERT IGNORE INTO account_details (account_number, account_name, user_id, account_balance, risk_level, account_pwd) VALUES (%s, %s, %s, %s, %s, %s)", account_data)

        # We need a location mapping to insert locations first
        locations = {
            'TXN001': ('LOC001', '192.168.1.1', 'Mumbai, India', 0),
            'TXN002': ('LOC001', '192.168.1.1', 'Mumbai, India', 0),
            'TXN003': ('LOC002', '45.33.21.9', 'Lagos, Nigeria', 1),
            'TXN004': ('LOC002', '45.33.21.9', 'Lagos, Nigeria', 1),
            'TXN005': ('LOC002', '45.33.21.9', 'Lagos, Nigeria', 1),
            'TXN006': ('LOC002', '45.33.21.9', 'Lagos, Nigeria', 1),
            'TXN007': ('LOC003', '10.0.0.5', 'Delhi, India', 0),
            'TXN008': ('LOC004', '77.88.55.60', 'Kyiv, Ukraine', 1),
            'TXN009': ('LOC005', '172.16.0.1', 'Chennai, India', 0),
            'TXN010': ('LOC005', '172.16.0.1', 'Chennai, India', 0),
            'TXN011': ('LOC006', '103.44.12.8', 'Karachi, Pakistan', 1),
            'TXN012': ('LOC006', '103.44.12.8', 'Karachi, Pakistan', 1),
            'TXN013': ('LOC006', '103.44.12.8', 'Karachi, Pakistan', 1),
            'TXN014': ('LOC001', '192.168.1.1', 'Mumbai, India', 0),
            'TXN015': ('LOC003', '10.0.0.5', 'Delhi, India', 0),
        }
        
        # Insert unique locations based on values
        unique_locs = {v[0]: v for v in locations.values()}
        cursor.executemany("INSERT IGNORE INTO location (location_id, ip_address, city_country, is_known_proxy) VALUES (%s, %s, %s, %s)", list(unique_locs.values()))


        # Insert Transactions
        transaction_data = [
            ('TXN001', 'ACC001', 500, '2024-01-15 10:00:00', 'DEBIT', 'COMPLETED', locations['TXN001'][0]),
            ('TXN002', 'ACC001', 450, '2024-01-15 10:02:00', 'DEBIT', 'COMPLETED', locations['TXN002'][0]),
            ('TXN003', 'ACC002', 95000, '2024-01-15 11:00:00', 'TRANSFER', 'BLOCKED', locations['TXN003'][0]),
            ('TXN004', 'ACC002', 1200, '2024-01-15 11:01:00', 'DEBIT', 'BLOCKED', locations['TXN004'][0]),
            ('TXN005', 'ACC002', 800, '2024-01-15 11:02:00', 'DEBIT', 'BLOCKED', locations['TXN005'][0]),
            ('TXN006', 'ACC002', 600, '2024-01-15 11:03:00', 'DEBIT', 'BLOCKED', locations['TXN006'][0]),
            ('TXN007', 'ACC003', 2000, '2024-01-15 12:00:00', 'CREDIT', 'COMPLETED', locations['TXN007'][0]),
            ('TXN008', 'ACC003', 18000, '2024-01-15 13:00:00', 'TRANSFER', 'FLAGGED', locations['TXN008'][0]),
            ('TXN009', 'ACC004', 3500, '2024-01-15 14:00:00', 'DEBIT', 'COMPLETED', locations['TXN009'][0]),
            ('TXN010', 'ACC004', 4000, '2024-01-15 14:30:00', 'DEBIT', 'COMPLETED', locations['TXN010'][0]),
            ('TXN011', 'ACC005', 700, '2024-01-15 15:00:00', 'DEBIT', 'FLAGGED', locations['TXN011'][0]),
            ('TXN012', 'ACC005', 650, '2024-01-15 15:01:00', 'DEBIT', 'FLAGGED', locations['TXN012'][0]),
            ('TXN013', 'ACC005', 900, '2024-01-15 15:02:00', 'DEBIT', 'FLAGGED', locations['TXN013'][0]),
            ('TXN014', 'ACC001', 550, '2024-01-15 16:00:00', 'CREDIT', 'COMPLETED', locations['TXN014'][0]),
            ('TXN015', 'ACC003', 300, '2024-01-15 17:00:00', 'DEBIT', 'COMPLETED', locations['TXN015'][0])
        ]
        cursor.executemany("INSERT IGNORE INTO `transaction` (transaction_id, account_number, amount, date_time, transaction_type, status_code, location_id) VALUES (%s, %s, %s, %s, %s, %s, %s)", transaction_data)


        # Insert Blacklist
        blacklist_data = [
            ('BL001', '45.33.21.9', 'Known fraud IP - Nigeria', '2024-01-10'),
            ('BL002', 'Lagos, Nigeria', 'High fraud region', '2024-01-10'),
            ('BL003', '103.44.12.8', 'Suspicious proxy server', '2024-01-12'),
            ('BL004', 'Karachi, Pakistan', 'Multiple fraud reports', '2024-01-12')
        ]
        cursor.executemany("INSERT IGNORE INTO blacklist (blacklist_id, blocked_value, reason_code, date_added) VALUES (%s, %s, %s, %s)", blacklist_data)


        # Insert Fraud Alerts
        alert_data = [
            ('ALT001', 'TXN003', 'ACC002', 90, 'OPEN', 'Unusual Amount, Blacklisted Location'),
            ('ALT002', 'TXN004', 'ACC002', 30, 'OPEN', 'Rapid Transactions'),
            ('ALT003', 'TXN008', 'ACC003', 40, 'OPEN', 'Unusual Amount'),
            ('ALT004', 'TXN011', 'ACC005', 80, 'OPEN', 'Blacklisted Location, Rapid Transactions'),
            ('ALT005', 'TXN006', 'ACC002', 70, 'CLOSED', 'Rapid Transactions, Blacklisted Location')
        ]
        cursor.executemany("INSERT IGNORE INTO fraud_alert (alert_id, transaction_id, account_number, risk_score, alert_status, rules_fired) VALUES (%s, %s, %s, %s, %s, %s)", alert_data)
        
        conn.commit()
        print("Database rules seeded successfully.")
        
    except mysql.connector.Error as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    setup_database()
