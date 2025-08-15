#!/bin/bash

# Production Monitoring Setup Script
# Sets up Prometheus, Grafana, and Alertmanager for production monitoring

set -e

DOMAIN=${1:-"yourdomain.com"}
GRAFANA_PASSWORD=${2:-"secure-grafana-password"}
SLACK_WEBHOOK=${3:-""}

echo "Setting up production monitoring for domain: $DOMAIN"

# Create monitoring directories
mkdir -p monitoring/data/prometheus
mkdir -p monitoring/data/grafana
mkdir -p monitoring/data/alertmanager

# Set proper permissions
sudo chown -R 472:472 monitoring/data/grafana
sudo chown -R 65534:65534 monitoring/data/prometheus
sudo chown -R 65534:65534 monitoring/data/alertmanager

# Create Prometheus configuration
cat > monitoring/prometheus.production.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'production'
    replica: '1'

rule_files:
  - "production-alerts.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'udyam-backend'
    static_configs:
      - targets: ['backend:4000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s
    scrape_timeout: 10s

  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

  - job_name: 'blackbox'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
        - https://$DOMAIN
        - https://$DOMAIN/api/health
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115

  - job_name: 'ssl-exporter'
    static_configs:
      - targets: ['ssl-exporter:9219']
    params:
      target: ['$DOMAIN:443']
EOF

# Create Grafana provisioning configuration
mkdir -p monitoring/grafana/provisioning/datasources
mkdir -p monitoring/grafana/provisioning/dashboards

cat > monitoring/grafana/provisioning/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

cat > monitoring/grafana/provisioning/dashboards/dashboard.yml << EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

# Update Alertmanager configuration with Slack webhook if provided
if [ ! -z "$SLACK_WEBHOOK" ]; then
    sed -i "s|YOUR_SLACK_WEBHOOK_URL|$SLACK_WEBHOOK|g" monitoring/alertmanager.production.yml
fi

# Create Docker Compose override for monitoring
cat > docker-compose.monitoring.yml << EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.production.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/production-alerts.yml:/etc/prometheus/production-alerts.yml
      - ./monitoring/data/prometheus:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
    networks:
      - udyam-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    volumes:
      - ./monitoring/data/grafana:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=$GRAFANA_PASSWORD
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_DOMAIN=$DOMAIN
      - GF_SERVER_ROOT_URL=https://$DOMAIN:3001
      - GF_SECURITY_COOKIE_SECURE=true
      - GF_SECURITY_STRICT_TRANSPORT_SECURITY=true
      - GF_SNAPSHOTS_EXTERNAL_ENABLED=false
    networks:
      - udyam-network
    restart: unless-stopped

  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.production.yml:/etc/alertmanager/alertmanager.yml
      - ./monitoring/data/alertmanager:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=https://$DOMAIN:9093'
    networks:
      - udyam-network
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - udyam-network
    restart: unless-stopped

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres-exporter
    ports:
      - "9187:9187"
    environment:
      - DATA_SOURCE_NAME=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@db:5432/\${POSTGRES_DB}?sslmode=disable
    networks:
      - udyam-network
    restart: unless-stopped
    depends_on:
      - db

  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: redis-exporter
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=redis://redis:6379
      - REDIS_PASSWORD=\${REDIS_PASSWORD}
    networks:
      - udyam-network
    restart: unless-stopped
    depends_on:
      - redis

  blackbox-exporter:
    image: prom/blackbox-exporter:latest
    container_name: blackbox-exporter
    ports:
      - "9115:9115"
    volumes:
      - ./monitoring/blackbox.yml:/etc/blackbox_exporter/config.yml
    networks:
      - udyam-network
    restart: unless-stopped

  ssl-exporter:
    image: ribbybibby/ssl-exporter:latest
    container_name: ssl-exporter
    ports:
      - "9219:9219"
    networks:
      - udyam-network
    restart: unless-stopped

networks:
  udyam-network:
    external: true
EOF

# Create blackbox exporter configuration
cat > monitoring/blackbox.yml << EOF
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_http_versions: ["HTTP/1.1", "HTTP/2.0"]
      valid_status_codes: []
      method: GET
      headers:
        Host: $DOMAIN
        Accept-Language: en-US
      no_follow_redirects: false
      fail_if_ssl: false
      fail_if_not_ssl: true
      tls_config:
        insecure_skip_verify: false
      preferred_ip_protocol: "ip4"
EOF

# Create monitoring startup script
cat > scripts/start-monitoring.sh << 'EOF'
#!/bin/bash

echo "Starting production monitoring stack..."

# Start monitoring services
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 30

# Check service health
echo "Checking service health..."
curl -f http://localhost:9090/-/healthy || echo "Prometheus not ready"
curl -f http://localhost:3001/api/health || echo "Grafana not ready"
curl -f http://localhost:9093/-/healthy || echo "Alertmanager not ready"

echo "Monitoring stack started successfully!"
echo ""
echo "Access URLs:"
echo "- Prometheus: http://localhost:9090"
echo "- Grafana: http://localhost:3001 (admin/your-password)"
echo "- Alertmanager: http://localhost:9093"
echo ""
echo "To stop monitoring: docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml down"
EOF

chmod +x scripts/start-monitoring.sh

# Create monitoring health check script
cat > scripts/check-monitoring.sh << 'EOF'
#!/bin/bash

echo "Checking monitoring stack health..."

# Check Prometheus
if curl -s -f http://localhost:9090/-/healthy > /dev/null; then
    echo "✅ Prometheus is healthy"
else
    echo "❌ Prometheus is not healthy"
fi

# Check Grafana
if curl -s -f http://localhost:3001/api/health > /dev/null; then
    echo "✅ Grafana is healthy"
else
    echo "❌ Grafana is not healthy"
fi

# Check Alertmanager
if curl -s -f http://localhost:9093/-/healthy > /dev/null; then
    echo "✅ Alertmanager is healthy"
else
    echo "❌ Alertmanager is not healthy"
fi

# Check exporters
if curl -s -f http://localhost:9100/metrics > /dev/null; then
    echo "✅ Node Exporter is healthy"
else
    echo "❌ Node Exporter is not healthy"
fi

if curl -s -f http://localhost:9187/metrics > /dev/null; then
    echo "✅ Postgres Exporter is healthy"
else
    echo "❌ Postgres Exporter is not healthy"
fi

if curl -s -f http://localhost:9121/metrics > /dev/null; then
    echo "✅ Redis Exporter is healthy"
else
    echo "❌ Redis Exporter is not healthy"
fi

echo ""
echo "Monitoring stack health check complete!"
EOF

chmod +x scripts/check-monitoring.sh

echo "Production monitoring setup complete!"
echo ""
echo "Next steps:"
echo "1. Update environment variables in .env.production"
echo "2. Configure Slack webhook URL if needed"
echo "3. Start monitoring: ./scripts/start-monitoring.sh"
echo "4. Access Grafana at http://localhost:3001 (admin/$GRAFANA_PASSWORD)"
echo "5. Import additional dashboards as needed"