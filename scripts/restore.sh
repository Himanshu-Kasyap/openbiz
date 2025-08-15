#!/bin/bash

# Database Restore Script for Udyam Registration System
# Usage: ./scripts/restore.sh [environment] [backup_file]

set -e

ENVIRONMENT=${1:-production}
BACKUP_FILE=${2}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"

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

# Validate backup file
validate_backup_file() {
    if [ -z "$BACKUP_FILE" ]; then
        log_error "Backup file not specified"
        echo "Available backups:"
        ls -la "$BACKUP_DIR"/*.gz 2>/dev/null || echo "No backups found"
        exit 1
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    log_info "Using backup file: $BACKUP_FILE"
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

# Confirm restore operation
confirm_restore() {
    log_warn "WARNING: This will overwrite the current database!"
    log_warn "Environment: $ENVIRONMENT"
    log_warn "Backup file: $BACKUP_FILE"
    
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
}

# Stop services
stop_services() {
    log_info "Stopping services..."
    
    cd "$PROJECT_ROOT"
    docker-compose down
    
    log_info "Services stopped"
}

# Start database service
start_database() {
    log_info "Starting database service..."
    
    cd "$PROJECT_ROOT"
    docker-compose up -d db
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 15
    
    log_info "Database service started"
}

# Restore PostgreSQL database
restore_postgres() {
    log_info "Restoring PostgreSQL database..."
    
    # Extract database connection details from DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    # Determine backup file type and restore accordingly
    if [[ "$BACKUP_FILE" == *.custom.gz ]]; then
        # Custom format backup
        log_info "Restoring from custom format backup..."
        
        # Decompress backup
        TEMP_FILE="/tmp/restore_$(date +%s).custom"
        gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
        
        # Restore using pg_restore
        PGPASSWORD="$DB_PASS" pg_restore \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --verbose \
            --clean \
            --if-exists \
            "$TEMP_FILE"
        
        # Clean up temp file
        rm "$TEMP_FILE"
        
    elif [[ "$BACKUP_FILE" == *.sql.gz ]]; then
        # SQL format backup
        log_info "Restoring from SQL format backup..."
        
        # Restore using psql
        gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASS" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME"
    else
        log_error "Unsupported backup file format"
        exit 1
    fi
    
    log_info "PostgreSQL database restored successfully"
}

# Restore Redis data
restore_redis() {
    if [[ "$BACKUP_FILE" == *redis*.rdb.gz ]]; then
        log_info "Restoring Redis data..."
        
        # Extract Redis connection details
        REDIS_HOST=$(echo $REDIS_URL | sed -n 's/redis:\/\/\([^:]*\):.*/\1/p')
        REDIS_PORT=$(echo $REDIS_URL | sed -n 's/redis:\/\/[^:]*:\([0-9]*\).*/\1/p')
        
        # Decompress backup
        TEMP_FILE="/tmp/restore_$(date +%s).rdb"
        gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
        
        # Stop Redis service
        docker-compose stop redis
        
        # Copy backup file to Redis container
        docker cp "$TEMP_FILE" $(docker-compose ps -q redis):/data/dump.rdb
        
        # Start Redis service
        docker-compose start redis
        
        # Clean up temp file
        rm "$TEMP_FILE"
        
        log_info "Redis data restored successfully"
    else
        log_info "No Redis backup found in the specified file"
    fi
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    cd "$PROJECT_ROOT"
    docker-compose run --rm backend npx prisma migrate deploy
    
    log_info "Database migrations completed"
}

# Start all services
start_services() {
    log_info "Starting all services..."
    
    cd "$PROJECT_ROOT"
    
    case $ENVIRONMENT in
        development)
            docker-compose -f docker-compose.dev.yml up -d
            ;;
        staging|production)
            docker-compose -f docker-compose.yml up -d
            ;;
    esac
    
    log_info "All services started"
}

# Verify restore
verify_restore() {
    log_info "Verifying restore..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend health
    if curl -f http://localhost:4000/api/health > /dev/null 2>&1; then
        log_info "Backend health check passed"
    else
        log_error "Backend health check failed"
        return 1
    fi
    
    # Check database connectivity
    cd "$PROJECT_ROOT"
    if docker-compose exec backend npx prisma db pull > /dev/null 2>&1; then
        log_info "Database connectivity verified"
    else
        log_error "Database connectivity check failed"
        return 1
    fi
    
    log_info "Restore verification completed successfully"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Restore $status: $message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    if [ -n "${EMAIL_NOTIFICATION:-}" ]; then
        echo "$message" | mail -s "Udyam Restore $status" "$EMAIL_NOTIFICATION"
    fi
}

# Main restore function
main() {
    log_info "Starting restore for environment: $ENVIRONMENT"
    
    validate_backup_file
    load_environment
    confirm_restore
    
    # Trap errors and send notification
    trap 'log_error "Restore failed"; send_notification "FAILED" "Restore failed for $ENVIRONMENT environment"; exit 1' ERR
    
    stop_services
    start_database
    restore_postgres
    restore_redis
    run_migrations
    start_services
    verify_restore
    
    log_info "Restore completed successfully!"
    send_notification "SUCCESS" "Restore completed successfully for $ENVIRONMENT environment"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [environment] [backup_file]"
        echo "Environments: development, staging, production"
        echo "Backup file: Path to the backup file to restore"
        exit 0
        ;;
    *)
        main
        ;;
esac