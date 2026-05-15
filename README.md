# Transaction Fraud Detection System

A comprehensive real-time fraud detection system built with Flask and MySQL that monitors financial transactions, identifies suspicious activity, and manages fraud alerts.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Fraud Detection Rules](#fraud-detection-rules)
- [Contributing](#contributing)

## ✨ Features

- **Real-time Transaction Monitoring**: Process and analyze transactions in real-time
- **Multi-rule Fraud Detection**: Multiple fraud detection algorithms working in parallel
- **Risk-based Transaction Status**: Classify transactions as COMPLETED, FLAGGED, or BLOCKED
- **Alert Management**: Create, track, and resolve fraud alerts
- **Account Risk Levels**: Dynamic account risk classification (LOW, MEDIUM, HIGH)
- **Location Blacklisting**: Blacklist suspicious IPs and geographic locations
- **Dashboard Analytics**: View transaction statistics and active alerts
- **RESTful API**: Complete API for transaction and alert management

## 🛠 Tech Stack

- **Backend**: Python 3.x with Flask
- **Database**: MySQL
- **Database Driver**: mysql-connector-python
- **Frontend**: HTML/CSS/JavaScript (templates + static files)

## 📁 Project Structure

```
Transaction_fraud_system/
├── app.py                 # Main Flask application
├── fraud_engine.py        # Fraud detection logic and rules
├── mysql_setup.py         # Database schema and seed data
├── templates/             # HTML templates for web interface
├── static/                # CSS, JavaScript, and static assets
└── README.md              # This file
```

## 🚀 Installation

### Prerequisites

- Python 3.7 or higher
- MySQL 5.7 or higher
- pip (Python package manager)

### Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ishansingg04/Transaction_fraud_system.git
   cd Transaction_fraud_system
   ```

2. **Install Python Dependencies**
   ```bash
   pip install flask mysql-connector-python
   ```

3. **Configure Database Credentials**
   
   Edit `app.py` and `mysql_setup.py` to update your MySQL credentials:
   ```python
   # Change these values:
   host='localhost'
   user='root'
   password='your_password'
   ```

## 🗄️ Database Setup

### Initialize the Database

Run the database setup script to create tables and seed sample data:

```bash
python mysql_setup.py
```

This will:
- Create the `fraud_detection` database
- Create 6 tables: `account_details`, `status`, `location`, `transaction`, `fraud_alert`, `blacklist`
- Seed 5 sample accounts with test transactions
- Populate blacklist with known fraud locations

### Database Schema

#### account_details
```sql
- account_number (PK): Unique account identifier
- account_name: Customer name
- user_id: Unique user ID
- account_balance: Current balance
- risk_level: LOW | MEDIUM | HIGH
- account_pwd: Account password
```

#### transaction
```sql
- transaction_id (PK): Unique transaction ID
- account_number (FK): Associated account
- amount: Transaction amount
- date_time: Transaction timestamp
- transaction_type: DEBIT | CREDIT | TRANSFER
- status_code (FK): PENDING | COMPLETED | FLAGGED | BLOCKED
- location_id (FK): Transaction location details
```

#### fraud_alert
```sql
- alert_id (PK): Unique alert ID
- transaction_id (FK): Associated transaction
- account_number (FK): Associated account
- risk_score: Calculated risk score (0-100+)
- alert_status: OPEN | CLOSED
- rules_fired: Triggered fraud detection rules
```

#### blacklist
```sql
- blacklist_id (PK): Unique blacklist entry ID
- blocked_value: IP address or location to block
- reason_code: Reason for blacklisting
- date_added: Date added to blacklist
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file (optional) for sensitive data:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fraud_detection
```

### Flask Configuration

Update `app.py` for production:
```python
if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)
```

## 📊 Usage

### Start the Application

```bash
python app.py
```

The application will start on `http://localhost:5000`

### Sample Accounts

The database is seeded with these test accounts:

| Account | Name | Balance | Risk Level |
|---------|------|---------|-----------|
| ACC001 | Rahul Sharma | 45,000 | LOW |
| ACC002 | Priya Mehta | 120,000 | HIGH |
| ACC003 | Aman Khan | 8,500 | MEDIUM |
| ACC004 | Sneha Patel | 200,000 | LOW |
| ACC005 | Rohit Verma | 15,000 | HIGH |

## 🔌 API Endpoints

### Dashboard
- `GET /` - Load main dashboard

### Dashboard Data
- `GET /api/dashboard` - Get dashboard statistics and recent transactions

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create a new transaction

### Alerts
- `GET /api/alerts` - Get all fraud alerts
- `POST /api/alerts/<alert_id>/resolve` - Resolve a fraud alert

### Accounts
- `GET /api/accounts` - Get all accounts

### Blacklist Management
- `GET /api/blacklist` - Get blacklist entries
- `POST /api/blacklist` - Add new blacklist entry
- `DELETE /api/blacklist/<blacklist_id>` - Remove blacklist entry

### Example API Requests

**Create a Transaction**
```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "account_number": "ACC001",
    "amount": 5000,
    "transaction_type": "DEBIT",
    "ip_address": "192.168.1.1",
    "city_country": "Mumbai, India"
  }'
```

**Resolve a Fraud Alert**
```bash
curl -X POST http://localhost:5000/api/alerts/ALT001/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "false_positive",
    "blacklist_location": false
  }'
```

## 🔍 Fraud Detection Rules

The system uses three main fraud detection rules:

### 1. Unusual Amount Detection
- **Rule**: Transaction amount exceeds 3x the account's historical average
- **Risk Score**: 40 points
- **Threshold**: Monitored against last 10 transactions

### 2. Rapid Transaction Detection
- **Rule**: More than 3 transactions in a 5-minute window
- **Risk Score**: 30 points
- **Time Window**: Last 5 minutes from transaction

### 3. Blacklisted Location Detection
- **Rule**: Transaction from blacklisted IP or geographic location
- **Risk Score**: 50 points
- **Scope**: Checks against all blacklist entries

### Risk Scoring & Status Determination

```
Risk Score 0       → Status: COMPLETED  (No fraud detected)
Risk Score 1-69    → Status: FLAGGED    (Suspicious, needs review)
Risk Score 70+     → Status: BLOCKED    (High fraud probability)
```

## 🔐 Security Notes

⚠️ **Important for Production**:
- Remove hardcoded database credentials
- Use environment variables for sensitive data
- Enable HTTPS/SSL
- Implement proper authentication and authorization
- Add input validation and SQL injection prevention
- Use parameterized queries (already implemented)
- Consider adding rate limiting
- Implement logging and monitoring

## 🐛 Troubleshooting

### Database Connection Error
```
Error: 2003 - Can't connect to MySQL server
```
- Ensure MySQL is running
- Check database credentials in `app.py`
- Verify MySQL is listening on localhost:3306

### Table Already Exists
```
Error: Table 'fraud_detection.account_details' already exists
```
- This is normal, the script uses `CREATE TABLE IF NOT EXISTS`
- To reset, drop the database: `DROP DATABASE fraud_detection;`

### Import Error: mysql.connector
```bash
pip install mysql-connector-python
```

## 📈 Future Enhancements

- Machine learning-based fraud detection
- Advanced analytics and reporting
- Multi-user support with role-based access
- Real-time notifications (Email/SMS)
- Geolocation API integration
- Historical trend analysis
- API rate limiting and authentication
- Mobile application

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

**Ishan Singh** - [GitHub Profile](https://github.com/ishansingg04)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.

---

**Last Updated**: 2026-05-15
