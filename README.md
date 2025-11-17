# Automated Parking Management System (APMS)

A comprehensive, industry-grade parking management system with automated license plate recognition, real-time occupancy tracking, payment processing, and administrative dashboard.

## 🎯 Project Overview

APMS is a full-stack application implementing:
- Automated license plate recognition (simulated)
- Intelligent parking space allocation
- Entry/exit barrier control (simulated)
- Automated billing and payment processing
- Real-time admin dashboard with analytics
- Complete CI/CD pipeline
- Comprehensive test coverage (>75%)

## 🏗️ Architecture

### Technology Stack
- **Backend**: Node.js + Express
- **Frontend (Admin)**: React + Vite
- **Frontend (Terminal)**: React + Vite
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT + bcrypt
- **Testing**: Jest + Supertest
- **Containerization**: Docker + docker-compose
- **CI/CD**: GitHub Actions

### Repository Structure
```
apms/
├── backend/              # Node.js backend API
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   ├── tests/
│   ├── migrations/
│   └── seeders/
├── admin-frontend/       # React admin dashboard
├── terminal-ui/          # React driver terminal UI
├── infra/               # Docker and deployment configs
├── docs/                # Documentation
└── .github/workflows/   # CI/CD pipelines
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Docker & docker-compose (for containerized deployment)

### Local Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd SE1
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start with Docker Compose** (Recommended)
```bash
cd infra
docker-compose up
```

This will start:
- Backend API: http://localhost:3000
- Admin Dashboard: http://localhost:5173
- Terminal UI: http://localhost:5174
- PostgreSQL: localhost:5432

4. **Or run locally without Docker**

**Backend:**
```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```

**Admin Frontend:**
```bash
cd admin-frontend
npm install
npm run dev
```

**Terminal UI:**
```bash
cd terminal-ui
npm install
npm run dev
```

## 🧪 Testing

### Run all tests
```bash
cd backend
npm test
```

### Run specific test suites
```bash
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests
npm run test:system         # System/E2E tests
```

### Test Coverage
```bash
npm test -- --coverage
```
Coverage reports are generated in `backend/coverage/`

## 📊 Features

### User Stories Implemented
- **US-001 to US-016**: Complete implementation of all user stories

### API Endpoints

#### License Plate Recognition
- `POST /identify` - Detect license plate from image

#### Parking Management
- `POST /parking/allocate` - Allocate parking space
- `GET /parking/spaces` - Get all spaces
- `POST /parking/spaces/release` - Release space

#### Barrier Control
- `POST /barrier/entry` - Open entry barrier
- `POST /barrier/exit` - Open exit barrier

#### Payment
- `POST /payment/create` - Create payment transaction
- `POST /payment/confirm` - Confirm payment

#### Admin (Protected)
- `GET /admin/occupancy` - Real-time occupancy
- `GET /admin/revenue` - Revenue analytics
- `GET /admin/logs` - System logs

#### Authentication
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile

## 🔐 Authentication

Default credentials (development):
- **Admin**: username: `admin`, password: `admin123`
- **Technician**: username: `technician`, password: `tech123`

## 🔧 Configuration

Environment variables (`.env`):
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=apms_db

# Server
PORT=3000

# Parking
TOTAL_PARKING_SPACES=100
HOURLY_RATE=5.00
```

## 🏗️ Build & Deployment

### Docker deployment
```bash
cd infra
docker-compose up -d
```

## 📝 Documentation

- [API Specification](docs/API-SPEC.yaml)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Runbook](docs/RUNBOOK.md)
- [SRS Mapping](docs/SRS-MAPPING.md)

## 📊 CI/CD Pipeline

GitHub Actions workflow includes:
- Build, Test, Coverage, Lint, Security, Deploy Artifact

## 📄 License

MIT License