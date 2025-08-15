#!/bin/bash

# Production Deployment Verification Script
# Runs comprehensive tests to verify production deployment

set -e

FRONTEND_URL=${1:-"https://yourdomain.com"}
BACKEND_URL=${2:-"https://your-backend-url.railway.app"}
VERBOSE=${3:-false}

echo "🚀 Starting production deployment verification..."
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Function to check URL accessibility
check_url() {
    local url=$1
    local expected_status=${2:-200}
    local timeout=${3:-30}
    
    if curl -s -f --max-time $timeout -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        return 0
    else
        return 1
    fi
}

# Function to check SSL certificate
check_ssl() {
    local domain=$1
    local port=${2:-443}
    
    if echo | openssl s_client -servername "$domain" -connect "$domain:$port" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to run health checks
run_health_checks() {
    print_status "INFO" "Running health checks..."
    
    # Frontend accessibility
    if check_url "$FRONTEND_URL"; then
        print_status "SUCCESS" "Frontend is accessible"
    else
        print_status "ERROR" "Frontend is not accessible"
        return 1
    fi
    
    # Backend health endpoint
    if check_url "$BACKEND_URL/api/health"; then
        print_status "SUCCESS" "Backend health endpoint is responding"
    else
        print_status "ERROR" "Backend health endpoint is not responding"
        return 1
    fi
    
    # Check if backend returns valid JSON
    local health_response=$(curl -s "$BACKEND_URL/api/health" 2>/dev/null)
    if echo "$health_response" | jq -e '.status == "healthy"' >/dev/null 2>&1; then
        print_status "SUCCESS" "Backend health check returns valid response"
    else
        print_status "WARNING" "Backend health check response format may be incorrect"
        if [ "$VERBOSE" = "true" ]; then
            echo "Response: $health_response"
        fi
    fi
}

# Function to check security headers
check_security_headers() {
    print_status "INFO" "Checking security headers..."
    
    local headers=$(curl -s -I "$FRONTEND_URL" 2>/dev/null)
    
    # Check for security headers
    if echo "$headers" | grep -qi "x-frame-options"; then
        print_status "SUCCESS" "X-Frame-Options header present"
    else
        print_status "WARNING" "X-Frame-Options header missing"
    fi
    
    if echo "$headers" | grep -qi "x-content-type-options"; then
        print_status "SUCCESS" "X-Content-Type-Options header present"
    else
        print_status "WARNING" "X-Content-Type-Options header missing"
    fi
    
    if echo "$headers" | grep -qi "strict-transport-security"; then
        print_status "SUCCESS" "Strict-Transport-Security header present"
    else
        print_status "WARNING" "Strict-Transport-Security header missing"
    fi
}

# Function to check SSL certificates
check_ssl_certificates() {
    print_status "INFO" "Checking SSL certificates..."
    
    local frontend_domain=$(echo "$FRONTEND_URL" | sed 's|https\?://||' | sed 's|/.*||')
    local backend_domain=$(echo "$BACKEND_URL" | sed 's|https\?://||' | sed 's|/.*||')
    
    # Check frontend SSL
    if check_ssl "$frontend_domain"; then
        print_status "SUCCESS" "Frontend SSL certificate is valid"
        
        # Check certificate expiry
        local expiry=$(echo | openssl s_client -servername "$frontend_domain" -connect "$frontend_domain:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null || echo "0")
        local current_epoch=$(date +%s)
        local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        if [ $days_until_expiry -gt 30 ]; then
            print_status "SUCCESS" "Frontend SSL certificate expires in $days_until_expiry days"
        elif [ $days_until_expiry -gt 7 ]; then
            print_status "WARNING" "Frontend SSL certificate expires in $days_until_expiry days"
        else
            print_status "ERROR" "Frontend SSL certificate expires in $days_until_expiry days"
        fi
    else
        print_status "ERROR" "Frontend SSL certificate is invalid or not accessible"
    fi
    
    # Check backend SSL
    if check_ssl "$backend_domain"; then
        print_status "SUCCESS" "Backend SSL certificate is valid"
    else
        print_status "ERROR" "Backend SSL certificate is invalid or not accessible"
    fi
}

# Function to check performance
check_performance() {
    print_status "INFO" "Checking performance..."
    
    # Frontend load time
    local start_time=$(date +%s%N)
    if curl -s -f --max-time 10 "$FRONTEND_URL" >/dev/null; then
        local end_time=$(date +%s%N)
        local load_time=$(( (end_time - start_time) / 1000000 ))
        
        if [ $load_time -lt 3000 ]; then
            print_status "SUCCESS" "Frontend loads in ${load_time}ms"
        elif [ $load_time -lt 5000 ]; then
            print_status "WARNING" "Frontend loads in ${load_time}ms (acceptable but could be faster)"
        else
            print_status "ERROR" "Frontend loads in ${load_time}ms (too slow)"
        fi
    else
        print_status "ERROR" "Frontend performance test failed"
    fi
    
    # Backend response time
    local start_time=$(date +%s%N)
    if curl -s -f --max-time 10 "$BACKEND_URL/api/health" >/dev/null; then
        local end_time=$(date +%s%N)
        local response_time=$(( (end_time - start_time) / 1000000 ))
        
        if [ $response_time -lt 1000 ]; then
            print_status "SUCCESS" "Backend responds in ${response_time}ms"
        elif [ $response_time -lt 2000 ]; then
            print_status "WARNING" "Backend responds in ${response_time}ms (acceptable but could be faster)"
        else
            print_status "ERROR" "Backend responds in ${response_time}ms (too slow)"
        fi
    else
        print_status "ERROR" "Backend performance test failed"
    fi
}

# Function to check database connectivity
check_database() {
    print_status "INFO" "Checking database connectivity..."
    
    local health_response=$(curl -s "$BACKEND_URL/api/health" 2>/dev/null)
    
    if echo "$health_response" | jq -e '.database.status == "connected"' >/dev/null 2>&1; then
        print_status "SUCCESS" "Database is connected"
        
        local db_latency=$(echo "$health_response" | jq -r '.database.latency' 2>/dev/null)
        if [ "$db_latency" != "null" ] && [ "$db_latency" != "" ]; then
            if (( $(echo "$db_latency < 100" | bc -l) )); then
                print_status "SUCCESS" "Database latency is ${db_latency}ms"
            elif (( $(echo "$db_latency < 500" | bc -l) )); then
                print_status "WARNING" "Database latency is ${db_latency}ms (acceptable but could be better)"
            else
                print_status "ERROR" "Database latency is ${db_latency}ms (too high)"
            fi
        fi
    else
        print_status "ERROR" "Database connection failed"
    fi
}

# Function to test API endpoints
test_api_endpoints() {
    print_status "INFO" "Testing API endpoints..."
    
    # Test form schema endpoint
    if check_url "$BACKEND_URL/api/v1/form-schema"; then
        print_status "SUCCESS" "Form schema endpoint is accessible"
    else
        print_status "ERROR" "Form schema endpoint is not accessible"
    fi
    
    # Test validation endpoint with invalid data
    local validation_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"aadhaarNumber":"invalid","otp":"123"}' \
        "$BACKEND_URL/api/v1/registration/step1" 2>/dev/null)
    
    if echo "$validation_response" | jq -e '.success == false' >/dev/null 2>&1; then
        print_status "SUCCESS" "API validation is working correctly"
    else
        print_status "WARNING" "API validation response format may be incorrect"
        if [ "$VERBOSE" = "true" ]; then
            echo "Response: $validation_response"
        fi
    fi
}

# Function to run Jest tests
run_jest_tests() {
    print_status "INFO" "Running automated tests..."
    
    if [ -f "package.json" ] && command -v npm >/dev/null 2>&1; then
        # Set environment variables for tests
        export FRONTEND_URL="$FRONTEND_URL"
        export BACKEND_URL="$BACKEND_URL"
        
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            print_status "INFO" "Installing test dependencies..."
            npm install --silent
        fi
        
        # Run the verification tests
        if npm test -- tests/deployment/production-verification.test.js --silent; then
            print_status "SUCCESS" "All automated tests passed"
        else
            print_status "ERROR" "Some automated tests failed"
            return 1
        fi
    else
        print_status "WARNING" "Cannot run automated tests (npm not available or package.json missing)"
    fi
}

# Function to generate report
generate_report() {
    local report_file="deployment-verification-$(date +%Y%m%d-%H%M%S).txt"
    
    print_status "INFO" "Generating verification report..."
    
    cat > "$report_file" << EOF
Production Deployment Verification Report
Generated: $(date)

Frontend URL: $FRONTEND_URL
Backend URL: $BACKEND_URL

Test Results:
$(run_health_checks 2>&1)
$(check_security_headers 2>&1)
$(check_ssl_certificates 2>&1)
$(check_performance 2>&1)
$(check_database 2>&1)
$(test_api_endpoints 2>&1)

System Information:
- Verification run from: $(hostname)
- User: $(whoami)
- Date: $(date)
- Script version: 1.0.0

EOF
    
    print_status "SUCCESS" "Report generated: $report_file"
}

# Main execution
main() {
    echo "🔍 Production Deployment Verification"
    echo "======================================"
    echo ""
    
    # Check prerequisites
    if ! command -v curl >/dev/null 2>&1; then
        print_status "ERROR" "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        print_status "WARNING" "jq is not installed - some checks will be limited"
    fi
    
    if ! command -v openssl >/dev/null 2>&1; then
        print_status "WARNING" "openssl is not installed - SSL checks will be limited"
    fi
    
    # Run all checks
    local exit_code=0
    
    run_health_checks || exit_code=1
    echo ""
    
    check_security_headers
    echo ""
    
    check_ssl_certificates
    echo ""
    
    check_performance
    echo ""
    
    check_database
    echo ""
    
    test_api_endpoints
    echo ""
    
    # Run automated tests if available
    if [ "$VERBOSE" = "true" ]; then
        run_jest_tests || exit_code=1
        echo ""
    fi
    
    # Generate report
    generate_report
    echo ""
    
    # Final summary
    if [ $exit_code -eq 0 ]; then
        print_status "SUCCESS" "All critical checks passed! Deployment appears to be successful."
    else
        print_status "ERROR" "Some critical checks failed. Please review the issues above."
    fi
    
    echo ""
    echo "Verification complete!"
    
    exit $exit_code
}

# Show help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [FRONTEND_URL] [BACKEND_URL] [VERBOSE]"
    echo ""
    echo "Arguments:"
    echo "  FRONTEND_URL  Frontend URL (default: https://yourdomain.com)"
    echo "  BACKEND_URL   Backend URL (default: https://your-backend-url.railway.app)"
    echo "  VERBOSE       Set to 'true' for verbose output and automated tests"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 https://myapp.vercel.app https://myapi.railway.app"
    echo "  $0 https://myapp.vercel.app https://myapi.railway.app true"
    exit 0
fi

# Run main function
main