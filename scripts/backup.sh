#!/bin/bash

# Database Backup Script for Udyam Registration System
# Usage: ./scripts/backup.sh [environment]

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
create_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    log_info "Backup directory created: $BACKUP_DIR"
}

# Load environment variables
load_environment() {
    ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
    if [ -f "$ENV_FILE" ]; then
        export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
        log_info "Loaded environment from $ENV_FILE"
    else
        log_error "Environment file $ENV_FILE not found"
        exit 1
    fi
}

# Backup PostgreSQL database
backup_postgres() {
    log_info "Starting PostgreSQL backup..."
    
    BACKUP_FILE="$BACKUP_DIR/postgres_${ENVIRONMENT}_${TIMESTAMP}.sql"
    
    # Extract database connection details from DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    # Create backup using pg_dump
    PGPASSWORD="$DB_PASS" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=custom \
        --file="$BACKUP_FILE.custom"
    
    # Also create a plain SQL backup for easier inspection
    PGPASSWORD="$DB_PASS" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        > "$BACKUP_FILE"
    
    # Compress the backups
    gzip "$BACKUP_FILE"
    gzip "$BACKUP_FILE.custom"
    
    log_info "PostgreSQL backup completed: $BACKUP_FILE.gz"
}

# Backup Redis data
backup_redis() {
    log_info "Starting Redis backup..."
    
    BACKUP_FILE="$BACKUP_DIR/redis_${ENVIRONMENT}_${TIMESTAMP}.rdb"
    
    # Extract Redis connection details
    REDIS_HOST=$(echo $REDIS_URL | sed -n 's/redis:\/\/\([^:]*\):.*/\1/p')
    REDIS_PORT=$(echo $REDIS_URL | sed -n 's/redis:\/\/[^:]*:\([0-9]*\).*/\1/p')
    
    # Create Redis backup
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" --rdb "$BACKUP_FILE"
    
    # Compress the backup
    gzip "$BACKUP_FILE"
    
    log_info "Redis backup completed: $BACKUP_FILE.gz"
}

# Backup application files
backup_app_files() {
    log_info "Starting application files backup..."
    
    BACKUP_FILE="$BACKUP_DIR/app_files_${ENVIRONMENT}_${TIMESTAMP}.tar.gz"
    
    # Create tar archive of important application files
    tar -czf "$BACKUP_FILE" \
        --exclude="node_modules" \
        --exclude=".git" \
        --exclude="coverage" \
        --exclude="*.log" \
        --exclude="backups" \
        -C "$PROJECT_ROOT" \
        .
    
    log_info "Application files backup completed: $BACKUP_FILE"
}

# Backup scraper output
backup_scraper_output() {
    log_info "Starting scraper output backup..."
    
    SCRAPER_OUTPUT_DIR="$PROJECT_ROOT/scraper/output"
    if [ -d "$SCRAPER_OUTPUT_DIR" ]; then
        BACKUP_FILE="$BACKUP_DIR/scraper_output_${ENVIRONMENT}_${TIMESTAMP}.tar.gz"
        
        tar -czf "$BACKUP_FILE" -C "$SCRAPER_OUTPUT_DIR" .
        
        log_info "Scraper output backup completed: $BACKUP_FILE"
    else
        log_warn "Scraper output directory not found, skipping..."
    fi
}

# Clean old backups (keep last 7 days)
cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
    
    log_info "Old backups cleaned up"
}

# Upload backup to cloud storage (optional)
upload_to_cloud() {
    if [ -n "${AWS_S3_BACKUP_BUCKET:-}" ]; then
        log_info "Uploading backups to S3..."
        
        aws s3 sync "$BACKUP_DIR" "s3://$AWS_S3_BACKUP_BUCKET/udyam-backups/$ENVIRONMENT/" \
            --exclude "*" \
            --include "*${TIMESTAMP}*"
        
        log_info "Backups uploaded to S3"
    else
        log_info "No cloud storage configured, skipping upload"
    fi
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Backup $status: $message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    if [ -n "${EMAIL_NOTIFICATION:-}" ]; then
        echo "$message" | mail -s "Udyam Backup $status" "$EMAIL_NOTIFICATION"
    fi
}

# Main backup function
main() {
    log_info "Starting backup for environment: $ENVIRONMENT"
    
    create_backup_dir
    load_environment
    
    # Trap errors and send notification
    trap 'log_error "Backup failed"; send_notification "FAILED" "Backup failed for $ENVIRONMENT environment"; exit 1' ERR
    
    backup_postgres
    backup_redis
    backup_app_files
    backup_scraper_output
    cleanup_old_backups
    upload_to_cloud
    
    log_info "Backup completed successfully!"
    send_notification "SUCCESS" "Backup completed successfully for $ENVIRONMENT environment"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [environment]"
        echo "Environments: development, staging, production"
        exit 0
        ;;
    *)
        main
        ;;
esac