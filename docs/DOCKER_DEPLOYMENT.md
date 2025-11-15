# Docker Deployment Guide

This guide covers deploying the School Management System using Docker and the CI/CD pipeline.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development with Docker](#local-development-with-docker)
- [Building Docker Image](#building-docker-image)
- [GitHub Container Registry (GHCR)](#github-container-registry-ghcr)
- [Production Deployment](#production-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring and Health Checks](#monitoring-and-health-checks)

## Prerequisites

- Docker 24.0+ and Docker Compose 2.0+
- Node.js 20+ (for local development)
- PostgreSQL 16+ (or use Docker Compose)
- GitHub account with GHCR access

## Local Development with Docker

### Using Docker Compose

The easiest way to run the application locally with all dependencies:

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=school_management
DB_PORT=5432

# Application
APP_PORT=3000
DATABASE_URL=postgresql://postgres:your_secure_password@db:5432/school_management

# Authentication
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long
BETTER_AUTH_URL=http://localhost:3000

# M-Pesa (for production)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
```

## Building Docker Image

### Build Locally

```bash
# Build the image
docker build -t school-management-system:latest .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e BETTER_AUTH_SECRET=your-secret \
  school-management-system:latest
```

### Multi-platform Build

```bash
# Set up buildx
docker buildx create --use

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t school-management-system:latest \
  --push .
```

## GitHub Container Registry (GHCR)

The CI/CD pipeline automatically builds and pushes Docker images to GHCR.

### Image Naming Convention

Images are tagged with:

- `latest` - Latest build from main branch
- `develop` - Latest build from develop branch
- `sha-<commit>` - Specific commit SHA
- `v1.2.3` - Semantic version tags

### Pull Image from GHCR

```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull the image
docker pull ghcr.io/nmwakuni/bestsaas:latest

# Run the image
docker run -p 3000:3000 ghcr.io/nmwakuni/bestsaas:latest
```

### Configure GHCR Access

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Create a token with `read:packages` and `write:packages` scopes
3. Use the token to authenticate Docker

## Production Deployment

### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml school-app

# Check services
docker service ls

# Scale services
docker service scale school-app_app=3
```

### Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: school-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: school-app
  template:
    metadata:
      labels:
        app: school-app
    spec:
      containers:
        - name: app
          image: ghcr.io/nmwakuni/bestsaas:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
            - name: BETTER_AUTH_SECRET
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: auth-secret
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: school-app-service
spec:
  selector:
    app: school-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

Deploy to Kubernetes:

```bash
# Apply configuration
kubectl apply -f deployment.yaml

# Check deployment
kubectl get deployments
kubectl get pods
kubectl get services

# View logs
kubectl logs -f deployment/school-app
```

### AWS ECS

```bash
# Create ECR repository
aws ecr create-repository --repository-name school-management-system

# Tag and push image
docker tag school-management-system:latest \
  <account-id>.dkr.ecr.<region>.amazonaws.com/school-management-system:latest

docker push <account-id>.dkr.ecr.<region>.amazonaws.com/school-management-system:latest

# Create ECS task definition and service
aws ecs create-service --cluster production \
  --service-name school-app \
  --task-definition school-app:1 \
  --desired-count 2
```

## CI/CD Pipeline

### Pipeline Stages

1. **Code Quality** - TypeScript, ESLint, Prettier
2. **Tests** - Jest unit and integration tests
3. **Build** - Docker image build and push to GHCR
4. **Security** - Trivy vulnerability scanning
5. **Deploy** - Automatic deployment to production

### Triggering the Pipeline

The pipeline runs automatically on:

- Push to `main`, `develop`, or `claude/**` branches
- Pull requests to `main` or `develop`

### Required Secrets

Configure these secrets in GitHub Settings → Secrets and variables → Actions:

- `GITHUB_TOKEN` - Automatically provided by GitHub
- `CODECOV_TOKEN` - For code coverage reports (optional)
- `PRODUCTION_URL` - Production deployment URL (optional)

### Manual Deployment

Trigger manual deployment:

```bash
# Using GitHub CLI
gh workflow run ci-cd.yml

# Or via GitHub UI
# Go to Actions → CI/CD Pipeline → Run workflow
```

## Monitoring and Health Checks

### Health Check Endpoint

The application provides a health check endpoint:

```bash
# Check application health
curl http://localhost:3000/api/health

# Response (healthy)
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "service": "school-management-system",
  "uptime": 3600.5
}

# Response (unhealthy)
{
  "status": "unhealthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "disconnected",
  "service": "school-management-system",
  "error": "Connection refused"
}
```

### Container Health Checks

Docker health checks are configured in the Dockerfile:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' <container-id>

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' <container-id>
```

### Logging

View application logs:

```bash
# Docker Compose
docker-compose logs -f app

# Docker
docker logs -f <container-id>

# Kubernetes
kubectl logs -f deployment/school-app
```

### Metrics and Monitoring

Recommended monitoring stack:

- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization
- **Loki** - Log aggregation
- **Alertmanager** - Alert management

## Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check database connectivity
docker-compose exec db psql -U postgres -c "SELECT 1"

# Check network connectivity
docker-compose exec app ping db
```

#### Build Failures

```bash
# Clear Docker cache
docker buildx prune -f

# Rebuild without cache
docker build --no-cache -t school-management-system:latest .
```

#### Image Pull Errors

```bash
# Re-authenticate to GHCR
docker logout ghcr.io
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Verify image exists
docker pull ghcr.io/nmwakuni/bestsaas:latest
```

## Best Practices

1. **Security**
   - Never commit secrets to version control
   - Use secrets management (AWS Secrets Manager, HashiCorp Vault)
   - Regularly scan images for vulnerabilities
   - Run containers as non-root user (already configured)

2. **Performance**
   - Use multi-stage builds (already configured)
   - Enable Docker layer caching in CI/CD
   - Set appropriate resource limits
   - Use read-only root filesystem where possible

3. **Reliability**
   - Configure health checks (already configured)
   - Set restart policies
   - Use rolling updates
   - Implement graceful shutdown

4. **Monitoring**
   - Monitor container metrics
   - Set up log aggregation
   - Configure alerts for failures
   - Track deployment success rates

## Support

For issues and questions:

- GitHub Issues: https://github.com/nmwakuni/bestsaas/issues
- Documentation: https://github.com/nmwakuni/bestsaas/docs
