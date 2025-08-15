# Cloud Deployment Guide

This guide provides step-by-step instructions for deploying the Udyam Registration Replica to cloud platforms (Vercel for frontend, Railway for backend).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Backend Deployment (Railway)](#backend-deployment-railway)
- [Database Configuration](#database-configuration)
- [Domain and SSL Setup](#domain-and-ssl-setup)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Deployment Verification](#deployment-verification)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts
- [Vercel Account](https://vercel.com) for frontend hosting
- [Railway Account](https://railway.app) for backend hosting
- Domain registrar account (for custom domain)
- GitHub account (for repository access)

### Required Tools
- Git
- Node.js 18+
- npm or yarn
- curl (for testing)
- jq (for JSON parsing, optional)

### Environment Variables
Prepare the following environment variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database
SHADOW_DATABASE_URL=postgresql://username:password@host:port/shadow_database

# Security
SESSION_SECRET=your-very-secure-session-secret-minimum-32-characters
JWT_SECRET=your-jwt-secret-minimum-32-characters

# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# External Services
POSTPIN_API_KEY=your-postpin-api-key

# Monitoring (optional)
GRAFANA_PASSWORD=secure-grafana-password
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend for Deployment

1. **Update package.json scripts** (already configured):
   ```json
   {
     "scripts": {
       "build": "next build",
       "start": "next start"
     }
   }
   ```

2. **Verify Vercel configuration** (`frontend/vercel.json`):
   - Security headers configured
   - API rewrites to backend
   - Build settings optimized

### Step 2: Deploy to Vercel

#### Option A: Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from frontend directory**:
   ```bash
   cd frontend
   vercel --prod
   ```

4. **Configure environment variables**:
   ```bash
   vercel env add NEXT_PUBLIC_API_URL production
   # Enter your backend URL when prompted
   ```

#### Option B: GitHub Integration

1. **Connect GitHub repository** to Vercel:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Set root directory to `frontend`

2. **Configure build settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm ci`

3. **Add environment variables**:
   - Go to Project Settings → Environment Variables
   - Add `NEXT_PUBLIC_API_URL` with your backend URL

### Step 3: Configure Custom Domain (Optional)

1. **Add domain in Vercel**:
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update DNS records**:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.19.61
   ```

## Backend Deployment (Railway)

### Step 1: Prepare Backend for Deployment

1. **Verify Railway configuration** (`backend/railway.json`):
   - Build command includes Prisma generation
   - Start command runs migrations
   - Health check configured

2. **Update package.json** (already configured):
   ```json
   {
     "scripts": {
       "start": "node src/server.js",
       "build": "npm ci && npx prisma generate"
     }
   }
   ```

### Step 2: Deploy to Railway

#### Option A: Railway CLI

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Initialize project**:
   ```bash
   cd backend
   railway init
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

#### Option B: GitHub Integration

1. **Connect GitHub repository**:
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Set root directory to `backend`

2. **Configure build settings**:
   - Build Command: `npm ci && npx prisma generate`
   - Start Command: `npx prisma migrate deploy && npm start`

### Step 3: Add PostgreSQL Database

1. **Add PostgreSQL service**:
   ```bash
   railway add postgresql
   ```

2. **Get database URL**:
   ```bash
   railway variables
   ```

3. **Set environment variables**:
   ```bash
   railway variables set DATABASE_URL="postgresql://..."
   railway variables set SESSION_SECRET="your-session-secret"
   railway variables set JWT_SECRET="your-jwt-secret"
   railway variables set CORS_ORIGIN="https://your-frontend-domain.vercel.app"
   railway variables set POSTPIN_API_KEY="your-api-key"
   ```

## Database Configuration

### Step 1: Set Up Production Database

1. **Run database setup script**:
   ```bash
   # Connect to your Railway PostgreSQL instance
   psql $DATABASE_URL -f backend/scripts/setup-production-db.sql
   ```

2. **Run Prisma migrations**:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

3. **Verify database setup**:
   ```bash
   npx prisma db pull
   ```

### Step 2: Configure Database Security

1. **Enable SSL connections** (Railway PostgreSQL has SSL by default)

2. **Set up connection pooling**:
   - Railway automatically provides connection pooling
   - Monitor connection usage in Railway dashboard

3. **Configure backup strategy**:
   - Railway provides automatic backups
   - Set up additional backup scripts if needed

## Domain and SSL Setup

### Step 1: Configure Custom Domain

1. **Frontend domain** (Vercel):
   - Add domain in Vercel dashboard
   - Update DNS records as instructed
   - SSL certificate is automatically provisioned

2. **Backend domain** (Railway):
   - Add custom domain in Railway dashboard
   - Update DNS records:
     ```
     Type: CNAME
     Name: api
     Value: your-project.railway.app
     ```

### Step 2: Update Environment Variables

1. **Update frontend environment**:
   ```bash
   vercel env add NEXT_PUBLIC_API_URL production
   # Enter: https://api.yourdomain.com
   ```

2. **Update backend environment**:
   ```bash
   railway variables set CORS_ORIGIN="https://yourdomain.com"
   ```

### Step 3: Test SSL Configuration

1. **Test SSL certificates**:
   ```bash
   curl -I https://yourdomain.com
   curl -I https://api.yourdomain.com
   ```

2. **Verify security headers**:
   ```bash
   curl -I https://yourdomain.com | grep -i security
   ```

## Monitoring and Alerting

### Step 1: Set Up Application Monitoring

1. **Configure monitoring** (if using external monitoring):
   ```bash
   # Set up monitoring environment variables
   railway variables set GRAFANA_PASSWORD="secure-password"
   railway variables set SLACK_WEBHOOK_URL="your-webhook-url"
   ```

2. **Deploy monitoring stack** (optional, for self-hosted monitoring):
   ```bash
   ./scripts/setup-monitoring.sh yourdomain.com
   ```

### Step 2: Configure Alerts

1. **Platform-specific monitoring**:
   - **Vercel**: Built-in analytics and monitoring
   - **Railway**: Built-in metrics and logging

2. **Custom alerts** (if using external monitoring):
   - Update `monitoring/production-alerts.yml`
   - Configure Slack/email notifications

### Step 3: Set Up Health Checks

1. **Vercel health checks**:
   - Automatic uptime monitoring
   - Performance insights in dashboard

2. **Railway health checks**:
   - Configure health check endpoint: `/api/health`
   - Set up custom monitoring if needed

## Deployment Verification

### Step 1: Run Automated Verification

1. **Run verification script**:
   ```bash
   ./scripts/verify-deployment.sh https://yourdomain.com https://api.yourdomain.com true
   ```

2. **Run Jest tests**:
   ```bash
   FRONTEND_URL=https://yourdomain.com BACKEND_URL=https://api.yourdomain.com npm test tests/deployment/production-verification.test.js
   ```

### Step 2: Manual Testing

1. **Frontend testing**:
   - Load homepage: `https://yourdomain.com`
   - Test form functionality
   - Verify responsive design on mobile

2. **Backend testing**:
   - Health check: `https://api.yourdomain.com/api/health`
   - API endpoints: `https://api.yourdomain.com/api/v1/form-schema`
   - Error handling: Test with invalid data

3. **Integration testing**:
   - Complete form submission flow
   - Cross-origin requests
   - Error handling

### Step 3: Performance Testing

1. **Load testing**:
   ```bash
   # Test frontend performance
   curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com
   
   # Test backend performance
   curl -w "@curl-format.txt" -o /dev/null -s https://api.yourdomain.com/api/health
   ```

2. **Security testing**:
   ```bash
   # Test security headers
   curl -I https://yourdomain.com | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)"
   
   # Test HTTPS redirect
   curl -I http://yourdomain.com
   ```

## Troubleshooting

### Common Issues

#### Frontend Issues

**Build Failures**:
```bash
# Check build logs in Vercel dashboard
# Common fixes:
- Verify Node.js version compatibility
- Check for missing dependencies
- Ensure environment variables are set
```

**Runtime Errors**:
```bash
# Check function logs in Vercel dashboard
# Common fixes:
- Verify API URL configuration
- Check CORS settings
- Validate environment variables
```

#### Backend Issues

**Deployment Failures**:
```bash
# Check deployment logs in Railway dashboard
# Common fixes:
- Verify Dockerfile/build configuration
- Check database connection
- Ensure all environment variables are set
```

**Database Connection Issues**:
```bash
# Test database connection
railway run npx prisma db pull

# Common fixes:
- Verify DATABASE_URL format
- Check database service status
- Ensure SSL is properly configured
```

#### SSL/Domain Issues

**SSL Certificate Problems**:
```bash
# Check certificate status
openssl s_client -servername yourdomain.com -connect yourdomain.com:443

# Common fixes:
- Wait for DNS propagation (up to 48 hours)
- Verify DNS records are correct
- Check domain verification status
```

**CORS Issues**:
```bash
# Test CORS configuration
curl -H "Origin: https://yourdomain.com" -H "Access-Control-Request-Method: GET" -X OPTIONS https://api.yourdomain.com/api/health

# Common fixes:
- Update CORS_ORIGIN environment variable
- Verify frontend domain is correct
- Check backend CORS middleware configuration
```

### Getting Help

1. **Platform Documentation**:
   - [Vercel Documentation](https://vercel.com/docs)
   - [Railway Documentation](https://docs.railway.app)

2. **Application Logs**:
   - Vercel: Function logs in dashboard
   - Railway: Application logs in dashboard

3. **Community Support**:
   - Vercel Discord/GitHub
   - Railway Discord/GitHub

### Emergency Procedures

#### Rollback Deployment

**Vercel Rollback**:
```bash
# Via CLI
vercel rollback [deployment-url]

# Via Dashboard
# Go to Deployments → Select previous deployment → Promote to Production
```

**Railway Rollback**:
```bash
# Via CLI
railway rollback

# Via Dashboard
# Go to Deployments → Select previous deployment → Redeploy
```

#### Database Recovery

**Backup Database**:
```bash
# Create backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore backup
psql $DATABASE_URL < backup-file.sql
```

#### Emergency Contacts

- **System Administrator**: admin@yourdomain.com
- **Development Team**: dev@yourdomain.com
- **Platform Support**: Use platform-specific support channels

## Maintenance

### Regular Tasks

**Weekly**:
- Check deployment status
- Review error logs
- Monitor performance metrics
- Verify SSL certificate status

**Monthly**:
- Update dependencies
- Review security settings
- Analyze usage patterns
- Update documentation

**Quarterly**:
- Security audit
- Performance optimization
- Backup testing
- Disaster recovery testing

### Automation

**CI/CD Pipeline**:
- Automatic deployments on git push
- Automated testing before deployment
- Environment-specific configurations

**Monitoring**:
- Automated health checks
- Performance monitoring
- Error alerting
- Usage analytics

This deployment guide should be customized based on your specific requirements and organizational policies.