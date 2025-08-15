#!/bin/bash

# Database initialization script for PostgreSQL
# This script runs when the PostgreSQL container starts for the first time

set -e

# Create additional databases if needed
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    
    -- Create additional schemas if needed
    CREATE SCHEMA IF NOT EXISTS audit;
    
    -- Create audit table for tracking changes
    CREATE TABLE IF NOT EXISTS audit.audit_log (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        table_name VARCHAR(255) NOT NULL,
        operation VARCHAR(10) NOT NULL,
        old_data JSONB,
        new_data JSONB,
        user_id VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit.audit_log(table_name);
    CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit.audit_log(timestamp);
    
    -- Grant permissions
    GRANT USAGE ON SCHEMA audit TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO $POSTGRES_USER;
EOSQL

echo "Database initialization completed successfully"