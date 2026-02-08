#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$SCRIPT_DIR/docker"

print_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    print_info "Docker is available"
}

init_env() {
    if [ ! -f "$COMPOSE_DIR/.env" ]; then
        print_info "Creating .env file..."
        cat > "$COMPOSE_DIR/.env" << 'ENVEOF'
# Admin account credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password

# Server port
PORT=3000
ENVEOF
        print_warn "Please edit docker/.env to set your admin credentials:"
        print_warn "  - ADMIN_EMAIL: Your admin email"
        print_warn "  - ADMIN_PASSWORD: A secure password (min 8 chars)"
        echo ""
        read -p "Press Enter to continue after editing docker/.env, or Ctrl+C to abort..."
    else
        print_info ".env file already exists"
    fi
}

deploy() {
    print_info "Starting deployment..."
    check_docker
    init_env

    print_info "Pulling latest image..."
    docker compose -f "$COMPOSE_DIR/docker-compose.yml" pull

    print_info "Starting containers..."
    docker compose -f "$COMPOSE_DIR/docker-compose.yml" up -d

    print_info "Waiting for service to be ready..."
    sleep 5

    if docker compose -f "$COMPOSE_DIR/docker-compose.yml" ps | grep -q "Up"; then
        print_info "Deployment successful!"
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  HTML2PNG is now running!${NC}"
        echo -e "${GREEN}  Access: http://localhost:3000${NC}"
        echo -e "${GREEN}========================================${NC}"
    else
        print_error "Deployment failed. Check logs with: $0 logs"
        exit 1
    fi
}

update() {
    print_info "Starting update..."
    check_docker

    print_info "Pulling latest image..."
    docker compose -f "$COMPOSE_DIR/docker-compose.yml" pull

    print_info "Restarting containers with new image..."
    docker compose -f "$COMPOSE_DIR/docker-compose.yml" up -d

    print_info "Waiting for service to be ready..."
    sleep 5

    if docker compose -f "$COMPOSE_DIR/docker-compose.yml" ps | grep -q "Up"; then
        print_info "Update successful!"
    else
        print_error "Update failed. Check logs with: $0 logs"
        exit 1
    fi
}

stop() {
    print_info "Stopping service..."
    docker compose -f "$COMPOSE_DIR/docker-compose.yml" down
    print_info "Service stopped"
}

restart() {
    print_info "Restarting service..."
    docker compose -f "$COMPOSE_DIR/docker-compose.yml" restart
    print_info "Service restarted"
}

logs() {
    docker compose -f "$COMPOSE_DIR/docker-compose.yml" logs -f --tail=100
}

status() {
    echo ""
    print_info "Container status:"
    docker compose -f "$COMPOSE_DIR/docker-compose.yml" ps
    echo ""
    print_info "Recent logs:"
    docker compose -f "$COMPOSE_DIR/docker-compose.yml" logs --tail=20
}

backup() {
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).db"
    CONTAINER_ID=$(docker compose -f "$COMPOSE_DIR/docker-compose.yml" ps -q html2png 2>/dev/null)
    if [ -n "$CONTAINER_ID" ]; then
        docker cp "$CONTAINER_ID:/app/data/html2png.db" "./$BACKUP_FILE" 2>/dev/null && \
            print_info "Database backed up to: ./$BACKUP_FILE" || \
            print_warn "No database file found to backup"
    else
        print_warn "Container is not running. Cannot backup."
    fi
}

clean() {
    print_warn "This will remove containers and images. Data volumes will be preserved."
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose -f "$COMPOSE_DIR/docker-compose.yml" down --rmi all
        print_info "Cleanup complete"
    else
        print_info "Cleanup cancelled"
    fi
}

show_help() {
    echo "HTML2PNG Deployment Script"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  deploy   - First-time deployment (init + pull + start)"
    echo "  update   - Pull latest image and restart"
    echo "  start    - Start the service"
    echo "  stop     - Stop the service"
    echo "  restart  - Restart the service"
    echo "  status   - Show service status and recent logs"
    echo "  logs     - Follow container logs"
    echo "  backup   - Backup the database"
    echo "  clean    - Remove containers and images"
    echo "  help     - Show this help message"
}

case "${1:-}" in
    deploy)  deploy ;;
    update)  update ;;
    start)   docker compose -f "$COMPOSE_DIR/docker-compose.yml" up -d; print_info "Service started" ;;
    stop)    stop ;;
    restart) restart ;;
    status)  status ;;
    logs)    logs ;;
    backup)  backup ;;
    clean)   clean ;;
    help|--help|-h) show_help ;;
    *)
        if [ -z "${1:-}" ]; then
            show_help
        else
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
        fi
        ;;
esac
