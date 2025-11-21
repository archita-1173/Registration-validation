# Driver Registration Application

A full-stack web application for driver registration with document validation using OpenAI APIs.

## Features

- **Driver Onboarding Form**: React-based form with client-side validation
- **File Upload**: Secure document upload (License and Insurance documents)
- **Database Storage**: SQLite database to store registration records
- **Automated Validation**: Hourly cron job that validates registrations from the last 60 minutes using OpenAI APIs
- **Document Validation**: Checks if names match documents and validates expiry dates

## Tech Stack

- **Frontend**: React 18
- **Backend**: Node.js + Express
- **Database**: SQLite
- **File Storage**: Local filesystem
- **Validation**: OpenAI GPT-4 Vision API
- **Scheduling**: node-cron

## Project Structure

```
signup/
├── frontend/              # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── backend/              # Express backend server
│   ├── uploads/          # Document storage (created automatically)
│   │   ├── licenses/
│   │   └── insurance/
│   ├── database.js       # Database setup
│   ├── server.js         # Express server
│   ├── validation.js     # OpenAI validation logic
│   ├── .env.example
│   └── package.json
├── package.json          # Root package.json for convenience scripts
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API Key (for document validation)

## Installation

1. **Clone or navigate to the project directory**

2. **Install all dependencies** (root, frontend, and backend):
   ```bash
   npm run install-all
   ```

   Or install manually:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Set up environment variables**:
   
   Copy the example environment file:
   ```bash
   cd backend
   copy .env.example .env
   ```
   
   Edit `backend/.env` and add your OpenAI API key:
   ```
   PORT=5000
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Running the Application

### Option 1: Run both frontend and backend together (Recommended)

From the root directory:
```bash
npm run dev
```

This will start both the backend server (port 5000) and the React frontend (port 3000).

### Option 2: Run separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. **Register a Driver:**
   - Click on "Register Driver" tab (default)
   - Fill out the driver registration form:
     - First Name
     - Last Name
     - Email
     - Phone
     - Upload License Document (JPEG, PNG, or PDF)
     - License Expiry Date
     - Upload Insurance Document (JPEG, PNG, or PDF)
     - Insurance Expiry Date
   - Click "Submit Registration"
   - The form will be validated and submitted to the backend
   - Documents are stored in `backend/uploads/`
   - Registration data is stored in SQLite database
3. **View Registrations:**
   - Click on "View Registrations" tab at the top
   - See all registered drivers in a table format
   - View validation status, timestamps, and notes
   - Use the refresh button to update the list
4. A cron job runs hourly to validate registrations from the last 60 minutes using OpenAI

## API Endpoints

- `POST /api/register` - Submit driver registration
- `GET /api/registrations` - Get all registrations (for testing/admin)
- `GET /api/health` - Health check endpoint

## Validation Process

The cron job runs every hour and:
1. Fetches all registrations from the last 60 minutes with status "pending"
2. For each registration:
   - Reads the license and insurance documents
   - Sends them to OpenAI GPT-4 Vision API for validation
   - Checks if the driver's name appears in the documents
   - Validates that expiry dates match
   - Updates the database with validation status ("validated" or "failed")

## Database Schema

The `drivers` table contains:
- `id` - Primary key
- `first_name`, `last_name`, `email`, `phone` - Driver information
- `license_doc_path`, `insurance_doc_path` - File paths
- `license_expiry_date`, `insurance_expiry_date` - Expiry dates
- `created_at` - Registration timestamp
- `validated_at` - Validation timestamp
- `validation_status` - "pending", "validated", or "failed"
- `validation_notes` - Notes from validation process

## File Storage

Documents are stored in:
- `backend/uploads/licenses/` - License documents
- `backend/uploads/insurance/` - Insurance documents

Files are named with a unique timestamp and random number to prevent conflicts.

## Notes

- The OpenAI API key is required for document validation. Without it, the cron job will skip validation but registrations will still be stored.
- File size limit: 10MB per document
- Supported file types: JPEG, PNG, PDF
- The cron job runs at the top of every hour (e.g., 1:00, 2:00, 3:00)

## Viewing Database Entries

There are multiple ways to check your database:

1. **Admin View Page** (Easiest): Click "View Registrations" button in the web app
2. **API Endpoint**: Visit `http://localhost:5000/api/registrations` in your browser
3. **SQLite CLI**: Use `sqlite3 backend/database.sqlite` and run SQL queries
4. **GUI Tools**: Use DB Browser for SQLite or VS Code SQLite extensions

See `DATABASE_VIEWING.md` for detailed instructions and SQL query examples.

## Troubleshooting

1. **Port already in use**: Change the PORT in `backend/.env` or kill the process using the port
2. **OpenAI API errors**: Check your API key and ensure you have credits/quota
3. **File upload fails**: Check that `backend/uploads/` directories exist and have write permissions
4. **Database errors**: Ensure SQLite is properly installed and the database file can be created

## Development

- Backend uses `nodemon` for auto-reload during development
- Frontend uses React's development server with hot-reload
- Database file: `backend/database.sqlite` (created automatically)

## License

MIT

