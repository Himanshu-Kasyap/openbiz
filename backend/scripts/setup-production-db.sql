-- Production database security setup script
-- Run this script after creating the database

-- Create read-only user for monitoring
CREATE USER udyam_readonly WITH PASSWORD 'secure_readonly_password';
GRANT CONNECT ON DATABASE udyam_db TO udyam_readonly;
GRANT USAGE ON SCHEMA public TO udyam_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO udyam_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO udyam_readonly;

-- Create backup user
CREATE USER udyam_backup WITH PASSWORD 'secure_backup_password';
GRANT CONNECT ON DATABASE udyam_db TO udyam_backup;
GRANT USAGE ON SCHEMA public TO udyam_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO udyam_backup;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO udyam_backup;

-- Enable row level security on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for row level security
CREATE POLICY user_isolation ON users
  FOR ALL
  TO udyam_user
  USING (session_id = current_setting('app.current_session_id', true));

CREATE POLICY submission_isolation ON form_submissions
  FOR ALL
  TO udyam_user
  USING (user_id IN (
    SELECT id FROM users WHERE session_id = current_setting('app.current_session_id', true)
  ));

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (action, resource, details, created_at)
    VALUES ('INSERT', TG_TABLE_NAME, row_to_json(NEW), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (action, resource, details, created_at)
    VALUES ('UPDATE', TG_TABLE_NAME, json_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    ), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (action, resource, details, created_at)
    VALUES ('DELETE', TG_TABLE_NAME, row_to_json(OLD), NOW());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
CREATE TRIGGER users_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER form_submissions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON form_submissions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_session_id ON users(session_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_form_submissions_user_step ON form_submissions(user_id, step_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Set up connection limits
ALTER USER udyam_user CONNECTION LIMIT 50;
ALTER USER udyam_readonly CONNECTION LIMIT 10;
ALTER USER udyam_backup CONNECTION LIMIT 5;

-- Configure database parameters for security and performance
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;
ALTER SYSTEM SET deadlock_timeout = '1s';
ALTER SYSTEM SET statement_timeout = '30s';
ALTER SYSTEM SET idle_in_transaction_session_timeout = '10min';

-- Reload configuration
SELECT pg_reload_conf();