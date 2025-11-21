require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const db = require('./database');
const cron = require('node-cron');
const { validateRegistrations } = require('./validation');

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const licensesDir = path.join(uploadsDir, 'licenses');
const insuranceDir = path.join(uploadsDir, 'insurance');

fs.ensureDirSync(licensesDir);
fs.ensureDirSync(insuranceDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'licenseDoc') {
      cb(null, licensesDir);
    } else if (file.fieldname === 'insuranceDoc') {
      cb(null, insuranceDir);
    } else {
      cb(new Error('Invalid field name'));
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    }
  }
});

// API Routes
app.post('/api/register', upload.fields([
  { name: 'licenseDoc', maxCount: 1 },
  { name: 'insuranceDoc', maxCount: 1 }
]), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, licenseExpiryDate, insuranceExpiryDate } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !licenseExpiryDate || !insuranceExpiryDate) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!req.files || !req.files.licenseDoc || !req.files.insuranceDoc) {
      return res.status(400).json({ error: 'Both documents are required' });
    }

    const licenseDocPath = req.files.licenseDoc[0].path;
    const insuranceDocPath = req.files.insuranceDoc[0].path;

    // Insert into database
    db.run(
      `INSERT INTO drivers (first_name, last_name, email, phone, license_doc_path, license_expiry_date, insurance_doc_path, insurance_expiry_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, email, phone, licenseDocPath, licenseExpiryDate, insuranceDocPath, insuranceExpiryDate],
      function(err) {
        if (err) {
          // Clean up uploaded files if DB insert fails
          fs.removeSync(licenseDocPath);
          fs.removeSync(insuranceDocPath);
          
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Email already registered' });
          }
          return res.status(500).json({ error: 'Database error: ' + err.message });
        }

        res.status(201).json({
          message: 'Registration successful',
          id: this.lastID
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all registrations (for testing/admin)
app.get('/api/registrations', (req, res) => {
  db.all('SELECT * FROM drivers ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Manual trigger for validation (for testing)
app.post('/api/validate-now', async (req, res) => {
  try {
    console.log('Manual validation triggered via API');
    await validateRegistrations();
    res.json({ message: 'Validation job triggered successfully' });
  } catch (error) {
    console.error('Manual validation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start cron job to validate registrations every 1 hour
const cronJob = cron.schedule('0 * * * *', () => {
  const timestamp = new Date().toLocaleString();
  console.log(`[${timestamp}] Running validation job (every hour)...`);
  validateRegistrations().catch(err => {
    console.error('Error in validation job:', err);
  });
}, {
  scheduled: false // Don't start automatically, we'll start it manually
});

// Start server with error handling
app.listen(PORT, (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured' : 'NOT CONFIGURED - Please set OPENAI_API_KEY in .env'}`);
  console.log(`✓ Cron job scheduled: Every 1 hour`);
  
  // Start the cron job
  cronJob.start();
  console.log(`✓ Cron job started`);
  
  
});

