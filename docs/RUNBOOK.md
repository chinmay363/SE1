# APMS Runbook

## Operational Guide

### Starting the System

**Using Docker:**
```bash
cd infra
docker-compose up -d
```

**Manually:**
```bash
# Terminal 1 - Database
# Ensure PostgreSQL is running

# Terminal 2 - Backend
cd backend
npm start

# Terminal 3 - Admin Frontend
cd admin-frontend
npm run dev

# Terminal 4 - Terminal UI
cd terminal-ui
npm run dev
```

### Stopping the System

```bash
cd infra
docker-compose down
```

### Environment Variables

Create `.env` file from `.env.example` and configure:

**Critical Settings:**
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `PORT`

**Optional Settings:**
- `HOURLY_RATE` - Parking rate per hour (default: 5.00)
- `TOTAL_PARKING_SPACES` - Number of spaces (default: 100)
- `BARRIER_OPEN_DELAY_MS` - Barrier animation delay
- `LPR_PROCESSING_DELAY_MS` - LPR simulation delay

### Database Operations

**Run migrations:**
```bash
cd backend
npm run migrate
```

**Seed initial data:**
```bash
npm run seed
```

**Reset database:**
Connect to PostgreSQL and drop/recreate database, then run migrations and seeds.

### Logs

**Backend logs location:**
- Console output (development)
- `backend/logs/error.log` - Error logs
- `backend/logs/combined.log` - All logs

**Log levels:**
- `error` - Critical errors
- `warn` - Warnings
- `info` - Informational
- `debug` - Debug information

### Health Checks

**Backend health:**
```bash
curl http://localhost:3000/health
```

**Database connectivity:**
Check backend logs for database connection status.

### Common Issues

**Issue: Database connection failed**
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

**Issue: Port already in use**
- Change `PORT` in `.env`
- Kill process using the port

**Issue: JWT authentication fails**
- Verify `JWT_SECRET` is set
- Check token expiration settings

**Issue: Migration fails**
- Check database permissions
- Verify migration files exist
- Check database connection

### Recovery Actions

**System Reset:**
1. Login as admin
2. Navigate to Admin Dashboard
3. Click "Reset System" button
4. Confirm action

This will:
- Cancel all active sessions
- Reset parking spaces to available
- Log system maintenance event

**Manual Database Reset:**
```sql
-- Cancel active sessions
UPDATE parking_sessions SET status = 'cancelled' WHERE status = 'active';

-- Reset spaces
UPDATE parking_spaces SET status = 'available' WHERE status != 'maintenance';
```

### Monitoring

**Key Metrics to Monitor:**
- Occupancy rate
- Active sessions count
- Revenue per hour
- System errors in logs
- Unresolved alerts

**Performance Indicators:**
- API response time < 5 seconds
- Database query time
- Memory usage
- CPU usage

### Backup

**Database Backup:**
```bash
pg_dump -U apms_user apms_db > backup_$(date +%Y%m%d).sql
```

**Restore Database:**
```bash
psql -U apms_user apms_db < backup_20240101.sql
```

### Security

**Password Reset:**
Use bcrypt to hash new passwords before updating database.

**Token Refresh:**
Tokens automatically refresh using refresh token mechanism.

**Audit Trail:**
All admin actions are logged in the `logs` table with user ID, timestamp, and action details.

### Contact

For critical issues, refer to system logs and error messages.
