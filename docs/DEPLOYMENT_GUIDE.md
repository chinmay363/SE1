# APMS Deployment Guide

## Local Deployment with Docker

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

### Step-by-Step Deployment

1. **Clone Repository**
```bash
git clone <repository-url>
cd SE1
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Build and Start Services**
```bash
cd infra
docker-compose up --build -d
```

4. **Verify Deployment**
```bash
docker-compose ps
```

All services should show "Up" status.

5. **Access Applications**
- Backend API: http://localhost:3000
- Admin Dashboard: http://localhost:5173
- Terminal UI: http://localhost:5174

6. **Initialize Database**
```bash
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed
```

### Docker Services

**postgres**
- Image: postgres:15-alpine
- Port: 5432
- Volume: postgres_data

**backend**
- Build: backend/Dockerfile
- Port: 3000
- Depends: postgres

**admin-frontend**
- Build: admin-frontend/Dockerfile
- Port: 5173 (mapped to 80 in container)

**terminal-ui**
- Build: terminal-ui/Dockerfile
- Port: 5174 (mapped to 80 in container)

### Troubleshooting

**Issue: Services won't start**
```bash
docker-compose logs [service-name]
```

**Issue: Database connection failed**
Wait for postgres healthcheck to pass:
```bash
docker-compose logs postgres
```

**Issue: Port conflicts**
Edit ports in docker-compose.yml

### Stopping Services

```bash
docker-compose down
```

**Remove volumes:**
```bash
docker-compose down -v
```

## Production Deployment

### Additional Considerations

1. **Environment Variables**
   - Use strong JWT secrets
   - Configure proper database credentials
   - Set NODE_ENV=production

2. **HTTPS/SSL**
   - Configure reverse proxy (nginx/traefik)
   - Obtain SSL certificates
   - Update frontend URLs

3. **Database**
   - Use managed database service
   - Configure backups
   - Set up replication

4. **Monitoring**
   - Application logs
   - Database metrics
   - System resources

5. **Scaling**
   - Backend can be scaled horizontally
   - Use load balancer
   - Configure session persistence

### Cloud Deployment Options

**AWS:**
- ECS/Fargate for containers
- RDS for PostgreSQL
- ALB for load balancing

**Azure:**
- Azure Container Instances
- Azure Database for PostgreSQL
- Azure Load Balancer

**GCP:**
- Cloud Run
- Cloud SQL
- Cloud Load Balancing

### Maintenance

**Update Application:**
```bash
git pull
docker-compose down
docker-compose up --build -d
```

**Database Backup:**
```bash
docker-compose exec postgres pg_dump -U apms_user apms_db > backup.sql
```

**View Logs:**
```bash
docker-compose logs -f [service-name]
```
