const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database with schema
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    license_doc_path TEXT NOT NULL,
    license_expiry_date TEXT NOT NULL,
    insurance_doc_path TEXT NOT NULL,
    insurance_expiry_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    validated_at DATETIME,
    validation_status TEXT DEFAULT 'pending',
    validation_notes TEXT
  )`);
});

module.exports = db;

