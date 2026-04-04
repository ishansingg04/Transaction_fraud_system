import sqlite3
import os

DB_NAME = 'fraud_detection.db'

def create_connection():
    """Create a database connection to the SQLite database specified by db_name"""
    conn = None
    try:
        conn = sqlite3.connect(DB_NAME)
        # Enable foreign key constraints
        conn.execute("PRAGMA foreign_keys = 1")
        return conn
    except sqlite3.Error as e:
        print(f"Error connecting to database: {e}")
    return conn

def setup_database():
    """Create tables and insert seed data if not exists."""
    conn = create_connection()
    if conn is None:
        print("Cannot create the database connection.")
        return

    try:
        cursor = conn.cursor()

        # Create Tables
        print("Creating tables...")
        
        # 1. account_details
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS account_details (
                account_number TEXT PRIMARY KEY,
                account_name TEXT,
                user_id TEXT UNIQUE,
                account_balance REAL,
                risk_level TEXT CHECK(risk_level IN ('LOW','MEDIUM','HIGH')),
                account_pwd TEXT
            )
        """)

        # 2. status
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS status (
                status_code TEXT PRIMARY KEY,
                status_name TEXT
            )
        """)

        # 3. location
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS location (
                location_id TEXT PRIMARY KEY,
                ip_address TEXT,
                city_country TEXT,
                is_known_proxy INTEGER
            )
        """)

        # 4. transaction
        # Note: status_code and location_id can be added later as there might be transactions without locations initially, but schema specifies FK
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "transaction" (
                transaction_id TEXT PRIMARY KEY,
                account_number TEXT,
                amount REAL,
                date_time TEXT,
                transaction_type TEXT,
                status_code TEXT,
                location_id TEXT,
                FOREIGN KEY (account_number) REFERENCES account_details(account_number),
                FOREIGN KEY (status_code) REFERENCES status(status_code),
                FOREIGN KEY (location_id) REFERENCES location(location_id)
            )
        """)

        # 5. fraud_alert
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS fraud_alert (
                alert_id TEXT PRIMARY KEY,
                transaction_id TEXT,
                account_number TEXT,
                risk_score INTEGER,
                alert_status TEXT CHECK(alert_status IN ('OPEN','CLOSED')),
                rules_fired TEXT,
                FOREIGN KEY (transaction_id) REFERENCES "transaction"(transaction_id),
                FOREIGN KEY (account_number) REFERENCES account_details(account_number)
            )
        """)

        # 6. blacklist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS blacklist (
                blacklist_id TEXT PRIMARY KEY,
                blocked_value TEXT,
                reason_code TEXT,
                date_added TEXT
            )
        """)

        print("Tables created successfully.")

        # Seed Data
        print("Inserting seed data...")

        # Insert Status
        status_data = [
            ('PENDING', 'Pending'),
            ('COMPLETED', 'Completed'),
            ('FLAGGED', 'Flagged'),
            ('BLOCKED', 'Blocked')
        ]
        cursor.executemany("INSERT OR IGNORE INTO status (status_code, status_name) VALUES (?, ?)", status_data)

        # Insert Accounts
        account_data = [
            ('ACC001', 'Rahul Sharma', 'user_rs', 45000, 'LOW', 'pwd123'),
            ('ACC002', 'Priya Mehta', 'user_pm', 120000, 'HIGH', 'pwd123'),
            ('ACC003', 'Aman Khan', 'user_ak', 8500, 'MEDIUM', 'pwd123'),
            ('ACC004', 'Sneha Patel', 'user_sp', 200000, 'LOW', 'pwd123'),
            ('ACC005', 'Rohit Verma', 'user_rv', 15000, 'HIGH', 'pwd123')
        ]
        cursor.executemany("INSERT OR IGNORE INTO account_details (account_number, account_name, user_id, account_balance, risk_level, account_pwd) VALUES (?, ?, ?, ?, ?, ?)", account_data)

        # Insert Locations for initial transactions to satisfy FK
        # Will dynamically create these for seed transactions
        
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
        cursor.executemany("INSERT OR IGNORE INTO location (location_id, ip_address, city_country, is_known_proxy) VALUES (?, ?, ?, ?)", list(unique_locs.values()))


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
        cursor.executemany("INSERT OR IGNORE INTO \"transaction\" (transaction_id, account_number, amount, date_time, transaction_type, status_code, location_id) VALUES (?, ?, ?, ?, ?, ?, ?)", transaction_data)


        # Insert Blacklist
        blacklist_data = [
            ('BL001', '45.33.21.9', 'Known fraud IP - Nigeria', '2024-01-10'),
            ('BL002', 'Lagos, Nigeria', 'High fraud region', '2024-01-10'),
            ('BL003', '103.44.12.8', 'Suspicious proxy server', '2024-01-12'),
            ('BL004', 'Karachi, Pakistan', 'Multiple fraud reports', '2024-01-12')
        ]
        cursor.executemany("INSERT OR IGNORE INTO blacklist (blacklist_id, blocked_value, reason_code, date_added) VALUES (?, ?, ?, ?)", blacklist_data)


        # Insert Fraud Alerts
        alert_data = [
            ('ALT001', 'TXN003', 'ACC002', 90, 'OPEN', 'Unusual Amount, Blacklisted Location'),
            ('ALT002', 'TXN004', 'ACC002', 30, 'OPEN', 'Rapid Transactions'),
            ('ALT003', 'TXN008', 'ACC003', 40, 'OPEN', 'Unusual Amount'),
            ('ALT004', 'TXN011', 'ACC005', 80, 'OPEN', 'Blacklisted Location, Rapid Transactions'),
            ('ALT005', 'TXN006', 'ACC002', 70, 'CLOSED', 'Rapid Transactions, Blacklisted Location')
        ]
        cursor.executemany("INSERT OR IGNORE INTO fraud_alert (alert_id, transaction_id, account_number, risk_score, alert_status, rules_fired) VALUES (?, ?, ?, ?, ?, ?)", alert_data)


        conn.commit()
        print("Seed data inserted successfully.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    setup_database()
