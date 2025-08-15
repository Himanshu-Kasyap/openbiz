# Production Deployment Checklist

Use this checklist to ensure all deployment tasks are completed successfully.

## Pre-Deployment Checklist

### Code Preparation
- [ ] All code changes merged to main branch
- [ ] Version tagged in git (e.g., `v1.0.0`)
- [ ] All tests passing locally
- [ ] Code review completed
- [ ] Documentation updated

### Environment Configuration
- [ ] Production environment variables prepared
- [ ] Database connection strings configured
- [ ] API keys and secrets generated
- [ ] SSL certificates obtained (if using custom domain)
- [ ] Domain DNS records prepared

### Security Review
- [ ] Security headers configured
- [ ] CORS settings reviewed
- [ ] Input validation implemented
- [ ] Rate limiting configured
- [ ] Authentication/authorization tested
- [ ] Secrets management reviewed

## Frontend Deployment (Vercel)

### Vercel Setup
- [ ] Vercel account created and configured
- [ ] GitHub repository connected to Vercel
- [ ] Build settings configured:
  - [ ] Framework: Next.js
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `.next`
  - [ ] Install Command: `npm ci`
  - [ ] Root Directory: `frontend`

### Environment Variables
- [ ] `NEXT_PUBLIC_API_URL` set to backend URL
- [ ] All required environment variables configured
- [ ] Environment variables tested in preview deployment

### Domain Configuration
- [ ] Custom domain added (if applicable)
- [ ] DNS records configured:
  - [ ] A record: `@` → `76.76.19.61`
  - [ ] CNAME record: `www` → `cname.vercel-dns.com`
- [ ] SSL certificate automatically provisioned
- [ ] Domain verification completed

### Deployment Verification
- [ ] Build successful
- [ ] Deployment accessible at assigned URL
- [ ] Custom domain working (if configured)
- [ ] HTTPS redirect working
- [ ] Security headers present
- [ ] Mobile responsiveness verified

## Backend Deployment (Railway)

### Railway Setup
- [ ] Railway account created and configured
- [ ] GitHub repository connected to Railway
- [ ] Build settings configured:
  - [ ] Build Command: `npm ci && npx prisma generate`
  - [ ] Start Command: `npx prisma migrate deploy && npm start`
  - [ ] Root Directory: `backend`

### Database Setup
- [ ] PostgreSQL service added to Railway project
- [ ] Database URL obtained from Railway
- [ ] Production database schema script executed
- [ ] Prisma migrations deployed
- [ ] Database connection tested

### Environment Variables
- [ ] `DATABASE_URL` configured
- [ ] `SESSION_SECRET` set (32+ characters)
- [ ] `JWT_SECRET` set (32+ characters)
- [ ] `CORS_ORIGIN` set to frontend URL
- [ ] `POSTPIN_API_KEY` configured
- [ ] `NODE_ENV` set to `production`
- [ ] All environment variables tested

### Domain Configuration (Optional)
- [ ] Custom domain added in Railway
- [ ] DNS CNAME record configured:
  - [ ] `api` → `your-project.railway.app`
- [ ] SSL certificate automatically provisioned
- [ ] Domain verification completed

### Deployment Verification
- [ ] Build successful
- [ ] Application started without errors
- [ ] Health endpoint responding: `/api/health`
- [ ] Database connectivity confirmed
- [ ] API endpoints accessible
- [ ] CORS working with frontend

## Database Configuration

### Security Settings
- [ ] Production database user created with limited privileges
- [ ] Read-only user created for monitoring
- [ ] Backup user created
- [ ] Row-level security enabled on sensitive tables
- [ ] Audit triggers configured
- [ ] Connection limits set

### Performance Optimization
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Query performance optimized
- [ ] Database parameters tuned for production

### Backup Strategy
- [ ] Automated backup schedule configured
- [ ] Backup retention policy set
- [ ] Backup restoration tested
- [ ] Point-in-time recovery available

## SSL and Security

### SSL Certificates
- [ ] Frontend SSL certificate valid and auto-renewing
- [ ] Backend SSL certificate valid and auto-renewing
- [ ] SSL configuration tested with SSL Labs
- [ ] Certificate expiry monitoring set up

### Security Headers
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Strict-Transport-Security` configured
- [ ] `Content-Security-Policy` configured
- [ ] `Referrer-Policy` configured

### Security Testing
- [ ] HTTPS redirect working
- [ ] Security headers present
- [ ] CORS configuration tested
- [ ] Rate limiting functional
- [ ] Input validation working
- [ ] Error handling secure (no sensitive data leaked)

## Monitoring and Alerting

### Application Monitoring
- [ ] Health check endpoints configured
- [ ] Application metrics collection set up
- [ ] Error tracking configured
- [ ] Performance monitoring enabled

### Infrastructure Monitoring
- [ ] Server resource monitoring
- [ ] Database performance monitoring
- [ ] SSL certificate expiry monitoring
- [ ] Uptime monitoring configured

### Alerting
- [ ] Critical alerts configured (application down, high error rate)
- [ ] Warning alerts configured (high response time, resource usage)
- [ ] Alert notification channels set up (email, Slack)
- [ ] Alert escalation procedures documented

## Testing and Verification

### Automated Testing
- [ ] Production verification tests executed
- [ ] All critical user journeys tested
- [ ] API endpoint tests passed
- [ ] Security tests completed
- [ ] Performance tests executed

### Manual Testing
- [ ] Frontend accessibility verified
- [ ] Form submission workflow tested
- [ ] Error handling tested
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility checked

### Load Testing
- [ ] Application performance under load tested
- [ ] Database performance under load verified
- [ ] Rate limiting behavior confirmed
- [ ] Auto-scaling (if configured) tested

## Documentation and Communication

### Documentation Updates
- [ ] Deployment documentation updated
- [ ] API documentation current
- [ ] Environment setup guide updated
- [ ] Troubleshooting guide updated
- [ ] Runbook procedures documented

### Team Communication
- [ ] Deployment schedule communicated
- [ ] Stakeholders notified of go-live
- [ ] Support team briefed on new features
- [ ] Rollback procedures communicated

## Post-Deployment Tasks

### Immediate Verification (0-1 hour)
- [ ] All services responding
- [ ] Health checks passing
- [ ] Critical user journeys working
- [ ] No error spikes in logs
- [ ] Performance metrics normal

### Short-term Monitoring (1-24 hours)
- [ ] Application stability confirmed
- [ ] Performance metrics within acceptable ranges
- [ ] No critical alerts triggered
- [ ] User feedback collected
- [ ] Error rates within normal limits

### Long-term Monitoring (1-7 days)
- [ ] Performance trends analyzed
- [ ] Resource utilization reviewed
- [ ] User adoption metrics collected
- [ ] Feedback incorporated into backlog
- [ ] Lessons learned documented

## Rollback Procedures

### Rollback Triggers
- [ ] Critical functionality broken
- [ ] High error rates (>5% for 5+ minutes)
- [ ] Performance degradation (>50% slower)
- [ ] Security vulnerability discovered
- [ ] Data integrity issues

### Rollback Steps
- [ ] Rollback procedure documented and tested
- [ ] Database rollback strategy prepared
- [ ] Communication plan for rollback
- [ ] Post-rollback verification steps defined

## Sign-off

### Technical Sign-off
- [ ] **Lead Developer**: _________________ Date: _______
- [ ] **DevOps Engineer**: _________________ Date: _______
- [ ] **QA Lead**: _________________ Date: _______
- [ ] **Security Officer**: _________________ Date: _______

### Business Sign-off
- [ ] **Product Owner**: _________________ Date: _______
- [ ] **Project Manager**: _________________ Date: _______

### Final Deployment Approval
- [ ] **Deployment Manager**: _________________ Date: _______

---

## Emergency Contacts

- **On-call Engineer**: [phone/email]
- **System Administrator**: [phone/email]
- **Database Administrator**: [phone/email]
- **Security Team**: [phone/email]

## Quick Reference

### Important URLs
- **Frontend**: https://yourdomain.com
- **Backend**: https://api.yourdomain.com
- **Health Check**: https://api.yourdomain.com/api/health
- **Monitoring**: https://monitoring.yourdomain.com

### Key Commands
```bash
# Verify deployment
./scripts/verify-deployment.sh https://yourdomain.com https://api.yourdomain.com

# Check application health
curl -f https://api.yourdomain.com/api/health

# View logs (Railway)
railway logs

# View logs (Vercel)
vercel logs
```

### Rollback Commands
```bash
# Rollback frontend (Vercel)
vercel rollback [deployment-url]

# Rollback backend (Railway)
railway rollback
```

---

**Deployment Date**: _______________
**Deployment Version**: _______________
**Deployed By**: _______________