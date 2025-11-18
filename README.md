# Automated Parking Management System (APMS)

A comprehensive parking management system with automated license plate recognition, payment processing, and real-time monitoring.

## Features

- **Automated Entry/Exit**: License plate recognition for seamless vehicle entry and exit
- **Real-Time Occupancy Tracking**: Monitor available parking spaces in real-time
- **Payment Processing**: Automated fee calculation and payment confirmation
- **Admin Dashboard**: Comprehensive analytics, revenue tracking, and system management
- **Terminal Interface**: User-friendly kiosk interface for entry and exit operations

## Architecture

### Components

- **Backend API** (Node.js + Express + PostgreSQL)
- **Admin Frontend** (React + Vite)
- **Terminal UI** (React + Vite)
- **PostgreSQL Database**

### Tech Stack

- **Backend**: Node.js, Express, Sequelize ORM, PostgreSQL
- **Frontend**: React 18, Vite, Axios, Recharts
- **Authentication**: JWT (JSON Web Tokens)
- **Testing**: Jest, Supertest
- **CI/CD**: GitHub Actions

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Option 1: Docker (Recommended)

```bash
cd infra
docker-compose up -d
```

This starts all services:
- PostgreSQL: `localhost:5432`
- Backend API: `http://localhost:3000`
- Admin Frontend: `http://localhost:5173`
- Terminal UI: `http://localhost:5174`

### Option 2: Manual Setup

**1. Database Setup**

```bash
# Create database and user
createdb -U postgres apms_db
createuser -U postgres apms_user
psql -U postgres -c "ALTER USER apms_user WITH PASSWORD 'apms_password';"
```

**2. Backend Setup**

```bash
cd backend
npm install

# Copy environment variables
cp ../.env.example .env
# Edit .env with your database credentials

# Run migrations and seed data
npm run migrate
npm run seed

# Start development server
npm run dev
```

**3. Admin Frontend Setup**

```bash
cd admin-frontend
npm install
npm run dev
```

**4. Terminal UI Setup**

```bash
cd terminal-ui
npm install
npm run dev
```

## Configuration

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=apms_db
DB_USER=apms_user
DB_PASSWORD=apms_password

# Server
PORT=3000
NODE_ENV=development

# JWT Secrets (generate using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Parking Configuration
TOTAL_PARKING_SPACES=100
HOURLY_RATE=5.00
FIRST_HOUR_FREE=false
MAX_PARKING_HOURS=24

# Simulation Settings
BARRIER_OPEN_DELAY_MS=2000
LPR_FAILURE_RATE=0.05
LPR_PROCESSING_DELAY_MS=1000
```

## Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Technician Account:**
- Username: `technician`
- Password: `tech123`

**⚠️ Change these credentials in production!**

## Testing

### First Time Setup

Before running tests for the first time, you need to create and set up the test database:

```bash
cd backend

# Make sure PostgreSQL is running
# Option 1: Using Docker
cd ../infra && docker-compose up -d postgres && cd ../backend

# Option 2: Local PostgreSQL
# Make sure your local PostgreSQL service is running

# Set up the test database (creates database, runs migrations, and seeds)
npm run test:setup
```

**Note**: The test database user needs `CREATEDB` permission. If you get a permission error:

```bash
# Linux/macOS: Grant CREATEDB permission to the user
psql -U postgres -c "ALTER USER apms_user CREATEDB;"

# Windows: Use psql.exe
psql.exe -U postgres -c "ALTER USER apms_user CREATEDB;"
```

**For Windows users**: If `psql` is not in your PATH, find it in your PostgreSQL installation directory (usually `C:\Program Files\PostgreSQL\15\bin\`) and either add it to PATH or run it directly:

```bash
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "ALTER USER apms_user CREATEDB;"
```

**Alternative (SQL prompt)**: You can also use the PostgreSQL SQL prompt:

```sql
-- Connect to PostgreSQL (Windows: use psql from Start Menu or pgAdmin)
-- Then run these SQL commands:
ALTER USER apms_user CREATEDB;
CREATE DATABASE apms_test OWNER apms_user;
\q
```

Then manually run migrations and seeds:
```bash
cd backend
npm run migrate:test
npm run seed:test
```

### Running Tests

```bash
cd backend

# Run all tests with coverage
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:system

# Run linter
npm run lint
```

### Manual Test Database Setup

If you prefer to set up the test database manually:

```bash
# Create test database
createdb -U apms_user apms_test

# Run migrations on test database
npm run migrate:test

# Seed test database
npm run seed:test
```

### Coverage Goals

- **Target**: 75% overall coverage
- **Current Thresholds**:
  - Statements: 62%
  - Branches: 35%
  - Functions: 65%
  - Lines: 62%

## API Documentation

### Authentication

```bash
POST /auth/login
POST /auth/refresh
GET  /auth/profile
```

### Parking Operations

```bash
POST /identify              # License plate recognition
POST /parking/allocate      # Allocate parking space
GET  /parking/spaces        # List all spaces
GET  /parking/sessions/active # Active sessions
```

### Payment

```bash
POST /payment/create        # Create payment
POST /payment/confirm       # Confirm payment
GET  /payment/:paymentId    # Payment details
```

### Barrier Control

```bash
POST /barrier/entry         # Open entry barrier
POST /barrier/exit          # Open exit barrier
```

### Admin Endpoints (Requires Admin Role)

```bash
GET  /admin/occupancy       # Occupancy statistics
GET  /admin/revenue         # Revenue analytics
GET  /admin/dashboard       # Dashboard summary
GET  /admin/logs            # System logs
GET  /admin/events          # System events
POST /admin/reset           # Reset system
```

## Deployment

### Production Build

```bash
# Build frontend applications
cd admin-frontend && npm run build
cd terminal-ui && npm run build

# Backend uses Node.js directly
cd backend && npm start
```

### CI/CD

The project includes GitHub Actions workflows for:
- Automated testing
- Code coverage reporting
- Security scanning
- Deployment artifact creation

Coverage reports and build artifacts are automatically generated on each push.

## Project Structure

```
apms/
├── backend/                # Express API server
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation, error handling
│   │   └── utils/          # Utilities (JWT, logging, etc.)
│   ├── tests/              # Test suites
│   ├── migrations/         # Database migrations
│   └── seeders/            # Sample data
├── admin-frontend/         # React admin dashboard
├── terminal-ui/            # React terminal interface
├── infra/                  # Docker compose configuration
└── docs/                   # Additional documentation
```

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Write tests for new functionality
4. Run tests and ensure coverage thresholds are met
5. Create a pull request
6. CI/CD will automatically run tests and checks
7. Merge after approval

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify database exists
psql -U postgres -c "\l" | grep apms_db

# Test connection
psql -h localhost -U apms_user -d apms_db
```

### Port Conflicts

If ports are already in use, update the following:
- Backend: Change `PORT` in `.env`
- Admin Frontend: Update port in `admin-frontend/vite.config.js`
- Terminal UI: Update port in `terminal-ui/vite.config.js`

### Migration Errors

```bash
# Reset database (⚠️ destroys all data)
npm run migrate:undo:all
npm run migrate
npm run seed
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For issues and questions, please check:
- Documentation in `/docs`
- System logs in `backend/logs/`
- Database status via health endpoint: `http://localhost:3000/health`
