# Local Development Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd SE1
```

### 2. Database Setup

#### Option A: Manual PostgreSQL Setup

1. Start PostgreSQL service:
```bash
# On Linux/Mac
sudo service postgresql start

# On Windows (if installed as service)
net start postgresql-x64-14
```

2. Create database and user:
```bash
# Access PostgreSQL
psql -U postgres

# Run these SQL commands
CREATE DATABASE apms_dev;
CREATE USER apms_user WITH PASSWORD 'apms_password';
GRANT ALL PRIVILEGES ON DATABASE apms_dev TO apms_user;
\q
```

#### Option B: Docker Setup (Easier)

```bash
# Start PostgreSQL in Docker
docker run -d \
  --name apms-postgres \
  -e POSTGRES_DB=apms_dev \
  -e POSTGRES_USER=apms_user \
  -e POSTGRES_PASSWORD=apms_password \
  -p 5432:5432 \
  postgres:14

# Verify it's running
docker ps
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=apms_user
DB_PASSWORD=apms_password
DB_NAME=apms_dev

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Parking Configuration
TOTAL_PARKING_SPACES=100
ENTRY_GRACE_PERIOD_MINUTES=15
LPR_SIMULATION_DELAY_MS=1000
BARRIER_OPERATION_DELAY_MS=2000

# Pricing (in dollars per hour)
PRICING_BASE_RATE=5
PRICING_HOURLY_RATE=2.5
PRICING_DAILY_MAX=25
EOF

# Run database migrations
npm run migrate

# Seed initial data (creates 100 parking spaces + admin/technician users)
npm run seed

# Start the backend server
npm run dev
```

The backend should now be running at **http://localhost:5000**

**Default Users Created:**
- **Admin**: username: `admin`, password: `admin123`
- **Technician**: username: `technician`, password: `tech123`

### 4. Admin Frontend Setup

Open a **new terminal window**:

```bash
cd admin-frontend

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
VITE_API_URL=http://localhost:5000
EOF

# Start the development server
npm run dev
```

The admin frontend should now be running at **http://localhost:5173**

### 5. Terminal UI Setup

Open **another new terminal window**:

```bash
cd terminal-ui

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
VITE_API_URL=http://localhost:5000
EOF

# Start the development server
npm run dev
```

The terminal UI should now be running at **http://localhost:5174**

## Testing the Application

### Test the Backend API

```bash
cd backend

# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:system

# Run with coverage
npm test -- --coverage
```

### Using the Application

#### 1. Admin Dashboard (http://localhost:5173)

1. Login with admin credentials:
   - Username: `admin`
   - Password: `admin123`

2. Features:
   - View real-time occupancy
   - Monitor revenue analytics
   - View system logs
   - Manage parking spaces
   - Track active sessions

#### 2. Terminal UI (http://localhost:5174)

This simulates the driver-facing kiosk:

**Entry Flow:**
1. Click "Entry" tab
2. Either:
   - Upload an image, OR
   - Click "Simulate Capture" for demo
3. System identifies license plate
4. Click "Find Parking Space"
5. System allocates space
6. Click "Open Entry Barrier"
7. Note your session ID

**Exit Flow:**
1. Click "Exit" tab
2. Enter your session ID
3. Click "Calculate Payment"
4. Review amount and click "Process Payment"
5. Click "Open Exit Barrier"

### API Testing with curl

```bash
# Health check
curl http://localhost:5000/health

# Identify license plate (simulated)
curl -X POST http://localhost:5000/identify \
  -H "Content-Type: application/json" \
  -d '{"imageData":"test-image-data-base64"}'

# Login as admin
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get occupancy data (requires token from login)
curl http://localhost:5000/admin/occupancy \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### Database Connection Errors

```bash
# Check if PostgreSQL is running
psql -U apms_user -d apms_dev -h localhost

# If connection refused, ensure PostgreSQL is started
sudo service postgresql status

# For Docker
docker logs apms-postgres
```

### Port Already in Use

```bash
# Backend (port 5000)
lsof -ti:5000 | xargs kill -9

# Admin frontend (port 5173)
lsof -ti:5173 | xargs kill -9

# Terminal UI (port 5174)
lsof -ti:5174 | xargs kill -9
```

### Reset Database

```bash
cd backend

# Drop and recreate
psql -U postgres -c "DROP DATABASE IF EXISTS apms_dev;"
psql -U postgres -c "CREATE DATABASE apms_dev;"

# Run migrations and seeds again
npm run migrate
npm run seed
```

### Clear npm cache

```bash
# In each directory (backend, admin-frontend, terminal-ui)
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

### Making Changes

1. **Backend changes**: Server auto-restarts (nodemon)
2. **Frontend changes**: Hot Module Replacement (HMR) updates instantly
3. **Database schema changes**: Create new migration file

### Running Linter

```bash
cd backend
npm run lint
```

### Viewing Logs

```bash
# Backend logs are in backend/logs/
tail -f backend/logs/combined.log
tail -f backend/logs/error.log
```

## Production Build

### Backend

```bash
cd backend
NODE_ENV=production npm start
```

### Frontends

```bash
# Admin frontend
cd admin-frontend
npm run build
# Build output in: dist/

# Terminal UI
cd terminal-ui
npm run build
# Build output in: dist/
```

## Docker Compose (Full Stack)

For running everything with Docker:

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment (development/test/production) | development |
| PORT | Backend server port | 5000 |
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_USER | Database user | apms_user |
| DB_PASSWORD | Database password | apms_password |
| DB_NAME | Database name | apms_dev |
| JWT_SECRET | Secret for JWT tokens | (generate random) |
| JWT_EXPIRES_IN | Token expiration | 24h |
| TOTAL_PARKING_SPACES | Number of spaces to create | 100 |
| PRICING_BASE_RATE | Base parking fee | 5 |
| PRICING_HOURLY_RATE | Per hour rate | 2.5 |

### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:5000 |

## Next Steps

- Explore the API documentation at `docs/API-SPEC.yaml`
- Review test coverage: `backend/coverage/lcov-report/index.html`
- Check deployment guide: `docs/DEPLOYMENT.md`
- See system requirements: `docs/SRS_MAPPING.md`

## Support

For issues or questions:
- Check logs in `backend/logs/`
- Review error messages in browser console (F12)
- Verify all services are running
- Ensure database is accessible
