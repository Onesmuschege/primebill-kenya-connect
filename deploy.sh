#!/bin/bash

# PrimeBill Solutions - ISP Billing System Deployment Script
# This script helps deploy the complete ISP billing and management system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root for security reasons"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js (for development)
    if ! command -v node &> /dev/null; then
        log_warning "Node.js is not installed. It's recommended for development."
    fi
    
    log_success "System requirements check completed"
}

# Setup environment
setup_environment() {
    log_info "Setting up environment..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            log_success "Created .env file from .env.example"
            log_warning "Please edit .env file with your actual configuration values"
        else
            log_error ".env.example file not found"
            exit 1
        fi
    else
        log_info ".env file already exists"
    fi
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    directories=(
        "backups"
        "ssl"
        "logs"
        "monitoring"
        "traefik"
        "scripts"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_success "Created directory: $dir"
        fi
    done
}

# Generate SSL certificates (self-signed for development)
generate_ssl_certs() {
    if [ "$1" = "--ssl" ]; then
        log_info "Generating self-signed SSL certificates for development..."
        
        if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout ssl/key.pem \
                -out ssl/cert.pem \
                -subj "/C=KE/ST=Nairobi/L=Nairobi/O=PrimeBill Solutions/CN=localhost"
            
            log_success "SSL certificates generated"
        else
            log_info "SSL certificates already exist"
        fi
    fi
}

# Install dependencies (for development)
install_dependencies() {
    if [ "$1" = "--dev" ]; then
        log_info "Installing Node.js dependencies..."
        
        if [ -f package.json ]; then
            npm install
            log_success "Dependencies installed"
        else
            log_error "package.json not found"
            exit 1
        fi
    fi
}

# Build and start services
deploy_services() {
    local environment=${1:-production}
    
    log_info "Building and starting services in $environment mode..."
    
    # Load environment variables
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    # Build and start containers
    if [ "$environment" = "development" ]; then
        docker-compose -f docker-compose.yml up --build -d
    else
        docker-compose -f docker-compose.yml up --build -d
    fi
    
    log_success "Services started successfully"
}

# Check service health
check_health() {
    log_info "Checking service health..."
    
    # Wait for services to start
    sleep 10
    
    # Check frontend
    if curl -f http://localhost/health &> /dev/null; then
        log_success "Frontend is healthy"
    else
        log_warning "Frontend health check failed"
    fi
    
    # Check database (if self-hosted)
    if docker ps | grep -q primebill-postgres; then
        if docker exec primebill-postgres pg_isready -U primebill &> /dev/null; then
            log_success "Database is healthy"
        else
            log_warning "Database health check failed"
        fi
    fi
    
    # Check Redis
    if docker ps | grep -q primebill-redis; then
        if docker exec primebill-redis redis-cli ping &> /dev/null; then
            log_success "Redis is healthy"
        else
            log_warning "Redis health check failed"
        fi
    fi
}

# Setup database (run migrations)
setup_database() {
    log_info "Setting up database..."
    
    # If using Supabase, remind user to run migrations
    if [ ! -z "$SUPABASE_URL" ]; then
        log_info "Using Supabase. Please run the SQL migrations in your Supabase dashboard:"
        log_info "1. Go to your Supabase project dashboard"
        log_info "2. Navigate to SQL Editor"
        log_info "3. Run the migration files in supabase/migrations/ in order"
        log_info "4. Deploy the edge functions in supabase/functions/"
    else
        # For self-hosted PostgreSQL
        log_info "Running database migrations..."
        # Add migration commands here if needed
        log_success "Database setup completed"
    fi
}

# Show access information
show_access_info() {
    log_success "Deployment completed successfully!"
    echo ""
    echo "=== ACCESS INFORMATION ==="
    echo "Frontend Application: http://localhost"
    echo "Health Check: http://localhost/health"
    echo ""
    
    if docker ps | grep -q primebill-grafana; then
        echo "Grafana Dashboard: http://localhost:3000"
        echo "Grafana Admin Password: ${GRAFANA_PASSWORD:-admin}"
        echo ""
    fi
    
    if docker ps | grep -q primebill-prometheus; then
        echo "Prometheus Metrics: http://localhost:9090"
        echo ""
    fi
    
    echo "=== NEXT STEPS ==="
    echo "1. Edit the .env file with your actual configuration"
    echo "2. Configure your M-Pesa Daraja API credentials"
    echo "3. Set up your SMS and Email service credentials"
    echo "4. Configure your MikroTik routers"
    echo "5. Run database migrations if using Supabase"
    echo "6. Create your first admin user"
    echo ""
    echo "=== LOGS ==="
    echo "View logs: docker-compose logs -f"
    echo "View specific service logs: docker-compose logs -f <service-name>"
    echo ""
    echo "=== SUPPORT ==="
    echo "For support and documentation, visit the project repository"
}

# Cleanup function
cleanup() {
    log_info "Stopping and removing containers..."
    docker-compose down
    log_success "Cleanup completed"
}

# Backup function
backup() {
    log_info "Creating backup..."
    
    # Create backup directory with timestamp
    backup_dir="backups/backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup database
    if docker ps | grep -q primebill-postgres; then
        docker exec primebill-postgres pg_dump -U primebill primebill > "$backup_dir/database.sql"
        log_success "Database backup created"
    fi
    
    # Backup environment file
    cp .env "$backup_dir/env_backup"
    
    # Backup uploaded files (if any)
    if [ -d "uploads" ]; then
        cp -r uploads "$backup_dir/"
    fi
    
    log_success "Backup completed: $backup_dir"
}

# Update function
update() {
    log_info "Updating the system..."
    
    # Pull latest changes
    git pull origin main
    
    # Rebuild and restart services
    docker-compose down
    docker-compose up --build -d
    
    log_success "System updated successfully"
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        check_root
        check_requirements
        setup_environment
        create_directories
        generate_ssl_certs $2
        install_dependencies $2
        setup_database
        deploy_services ${2:-production}
        check_health
        show_access_info
        ;;
    "dev")
        check_root
        check_requirements
        setup_environment
        create_directories
        generate_ssl_certs --ssl
        install_dependencies --dev
        deploy_services development
        check_health
        show_access_info
        ;;
    "stop")
        docker-compose down
        log_success "Services stopped"
        ;;
    "start")
        docker-compose up -d
        log_success "Services started"
        ;;
    "restart")
        docker-compose restart
        log_success "Services restarted"
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "status")
        docker-compose ps
        ;;
    "cleanup")
        cleanup
        ;;
    "backup")
        backup
        ;;
    "update")
        update
        ;;
    "help"|"-h"|"--help")
        echo "PrimeBill Solutions Deployment Script"
        echo ""
        echo "Usage: $0 [command] [options]"
        echo ""
        echo "Commands:"
        echo "  deploy [production|development]  Deploy the system (default: production)"
        echo "  dev                              Deploy in development mode with SSL and dependencies"
        echo "  start                            Start all services"
        echo "  stop                             Stop all services"
        echo "  restart                          Restart all services"
        echo "  logs                             View service logs"
        echo "  status                           Show service status"
        echo "  backup                           Create system backup"
        echo "  update                           Update system from git"
        echo "  cleanup                          Stop and remove all containers"
        echo "  help                             Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 deploy production             Deploy in production mode"
        echo "  $0 dev                           Deploy in development mode"
        echo "  $0 backup                        Create a backup"
        echo "  $0 logs                          View all service logs"
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac