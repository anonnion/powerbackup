#!/bin/bash

# 🚀 PowerBackup v2.0.0 - Setup Script
# This script helps you set up PowerBackup quickly

set -e

echo "🚀 PowerBackup v2.0.0 - Setup Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    print_info "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        print_info "Download from: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_status "Node.js $(node --version) is installed"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install src dependencies
    cd src && npm install && cd ..
    
    print_status "Dependencies installed successfully"
}

# Create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    
    mkdir -p backups
    mkdir -p logs
    mkdir -p src/config
    
    print_status "Directories created"
}

# Setup configuration
setup_config() {
    print_info "Setting up configuration..."
    
    # Check if config already exists
    if [ -f "src/config/config.json" ]; then
        print_warning "Configuration file already exists. Skipping..."
        return
    fi
    
    # Copy example config
    if [ -f "src/config/config.example.json" ]; then
        cp src/config/config.example.json src/config/config.json
        print_status "Configuration file created from example"
        print_warning "Please edit src/config/config.json with your database settings"
    else
        print_error "Example configuration file not found"
        exit 1
    fi
}

# Setup GPG encryption (optional)
setup_gpg() {
    print_info "Setting up GPG encryption..."
    
    if ! command -v gpg &> /dev/null; then
        print_warning "GPG is not installed. Encryption will be disabled."
        print_info "To enable encryption, install GPG and run this script again."
        return
    fi
    
    # Check if passphrase file already exists
    if [ -f "src/config/passphrase" ]; then
        print_warning "GPG passphrase file already exists. Skipping..."
        return
    fi
    
    # Generate a secure passphrase
    PASSPHRASE=$(openssl rand -base64 32)
    echo "$PASSPHRASE" > src/config/passphrase
    chmod 600 src/config/passphrase
    
    print_status "GPG passphrase file created"
    print_warning "Keep your passphrase secure! It's stored in src/config/passphrase"
}

# Set file permissions
set_permissions() {
    print_info "Setting file permissions..."
    
    # Make scripts executable
    chmod +x install-cron.sh
    chmod +x setup.sh
    
    # Secure sensitive files
    if [ -f "src/config/passphrase" ]; then
        chmod 600 src/config/passphrase
    fi
    
    if [ -f "src/config/config.json" ]; then
        chmod 600 src/config/config.json
    fi
    
    print_status "File permissions set"
}

# Run tests
run_tests() {
    print_info "Running tests..."
    
    if npm run test:all; then
        print_status "All tests passed"
    else
        print_warning "Some tests failed. This is normal if databases are not configured."
    fi
}

# Show next steps
show_next_steps() {
    echo ""
    echo "🎉 PowerBackup setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Edit src/config/config.json with your database settings"
    echo "2. Test the installation: npm run help"
    echo "3. Create your first backup: npm run backup <database-name>"
    echo "4. Set up automated scheduling: see DEPLOYMENT.md"
    echo ""
    echo "📖 Documentation:"
    echo "- README.md - Quick start guide"
    echo "- DEPLOYMENT.md - Deployment options"
    echo ""
    echo "🔧 Useful commands:"
    echo "- npm run help - Show all available commands"
    echo "- npm run list - List configured databases"
    echo "- npm run test:all - Run all tests"
    echo ""
}

# Main setup function
main() {
    echo "Starting PowerBackup setup..."
    echo ""
    
    check_nodejs
    install_dependencies
    create_directories
    setup_config
    setup_gpg
    set_permissions
    run_tests
    show_next_steps
}

# Run main function
main "$@"
