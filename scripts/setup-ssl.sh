#!/bin/bash

# SSL Certificate Setup Script for Production
# This script sets up SSL certificates using Let's Encrypt

set -e

DOMAIN=${1:-"yourdomain.com"}
EMAIL=${2:-"admin@yourdomain.com"}
STAGING=${3:-false}

echo "Setting up SSL certificates for domain: $DOMAIN"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Stop nginx if running
systemctl stop nginx || true

# Determine certbot command based on staging flag
if [ "$STAGING" = "true" ]; then
    CERTBOT_CMD="certbot certonly --standalone --staging"
    echo "Using Let's Encrypt staging environment"
else
    CERTBOT_CMD="certbot certonly --standalone"
    echo "Using Let's Encrypt production environment"
fi

# Obtain certificate
$CERTBOT_CMD \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Create SSL directory for nginx
mkdir -p /etc/nginx/ssl

# Copy certificates to nginx directory
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/nginx/ssl/key.pem
cp /etc/letsencrypt/live/$DOMAIN/chain.pem /etc/nginx/ssl/chain.pem

# Set proper permissions
chmod 644 /etc/nginx/ssl/cert.pem
chmod 644 /etc/nginx/ssl/chain.pem
chmod 600 /etc/nginx/ssl/key.pem
chown root:root /etc/nginx/ssl/*

# Create renewal hook script
cat > /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh << 'EOF'
#!/bin/bash
# Copy renewed certificates to nginx directory
cp /etc/letsencrypt/live/$RENEWED_DOMAINS/fullchain.pem /etc/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/$RENEWED_DOMAINS/privkey.pem /etc/nginx/ssl/key.pem
cp /etc/letsencrypt/live/$RENEWED_DOMAINS/chain.pem /etc/nginx/ssl/chain.pem

# Set proper permissions
chmod 644 /etc/nginx/ssl/cert.pem
chmod 644 /etc/nginx/ssl/chain.pem
chmod 600 /etc/nginx/ssl/key.pem

# Reload nginx
systemctl reload nginx
EOF

chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh

# Set up automatic renewal
if ! crontab -l | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    echo "Added automatic renewal to crontab"
fi

# Test certificate
echo "Testing certificate..."
certbot certificates

# Generate DH parameters for enhanced security
if [ ! -f /etc/nginx/ssl/dhparam.pem ]; then
    echo "Generating DH parameters (this may take a while)..."
    openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048
    chmod 644 /etc/nginx/ssl/dhparam.pem
fi

echo "SSL certificates have been successfully set up!"
echo "Certificate location: /etc/nginx/ssl/"
echo "Automatic renewal configured via cron"

# Test renewal
echo "Testing certificate renewal..."
certbot renew --dry-run

echo "SSL setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your nginx configuration to use the certificates"
echo "2. Start nginx: systemctl start nginx"
echo "3. Enable nginx: systemctl enable nginx"
echo "4. Test your SSL configuration: https://www.ssllabs.com/ssltest/"