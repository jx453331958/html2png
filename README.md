# HTML to PNG Converter

A self-hosted service to convert HTML content to high-quality PNG images.

[中文文档](./README.zh-CN.md)

## Features

- Convert HTML to PNG with customizable viewport size
- Support for Device Pixel Ratio (1x, 2x, 3x) for high-DPI displays
- Full page screenshot option
- HTML file upload support
- User authentication with JWT
- API key management for programmatic access
- Admin panel with registration control
- Rate limiting protection
- Multi-language support (English, Chinese)
- Docker deployment ready

## Quick Start

### One-Click Deployment (Recommended)

```bash
# Clone the repository
git clone git@github.com:jx453331958/html2png.git
cd html2png

# Run the deployment script
./deploy.sh
```

The script will guide you through:
1. Creating admin account credentials
2. Configuring server port
3. Building and starting the Docker container

### Update to Latest Version

```bash
./update.sh
```

The update script will:
- Check for new updates from the repository
- Show changelog of new commits
- Pull latest changes and rebuild Docker container
- Preserve your existing configuration

### Manual Docker Deployment

```bash
# Clone the repository
git clone git@github.com:jx453331958/html2png.git
cd html2png/docker

# Create .env file
cat > .env << EOF
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
EOF

# Start the service
docker-compose up -d
```

### Local Development

```bash
# Clone the repository
git clone git@github.com:jx453331958/html2png.git
cd html2png/web

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=3000
HOST=0.0.0.0
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
EOF

# Start development server
npm run dev
```

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| HOST | 0.0.0.0 | Server host |
| ADMIN_EMAIL | - | Admin account email (optional) |
| ADMIN_PASSWORD | - | Admin account password (optional) |
| ENCRYPTION_KEY | - | AES-256 key for HTML content encryption (optional) |
| DATABASE_PATH | ./data/html2png.db | SQLite database path |

> Note: JWT secret is automatically generated and stored in the database. No manual configuration required.

## API Reference

### Authentication

All API endpoints require authentication via:
- **JWT Token**: `Authorization: Bearer <token>` header
- **API Key**: `X-API-Key: <key>` header

### Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```
Note: Registration must be enabled by admin first.

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

#### Convert HTML to PNG
```http
POST /api/convert
Content-Type: application/json
X-API-Key: h2p_your_api_key

{
  "html": "<h1>Hello World</h1>",
  "width": 1200,
  "height": 800,
  "dpr": 2,
  "fullPage": false
}
```

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| html | string | (required) | HTML content to convert |
| width | number | 1200 | Viewport width in pixels (100-4096) |
| height | number | auto | Viewport height in pixels (100-10000) |
| dpr | number | 1 | Device pixel ratio (1, 2, or 3) |
| fullPage | boolean | false | Capture full scrollable page |

**Response:** PNG image binary

#### API Keys Management
```http
GET    /api/keys          # List API keys
POST   /api/keys          # Create API key
DELETE /api/keys/:id      # Delete API key
```

## Usage Examples

### cURL
```bash
curl -X POST http://localhost:3000/api/convert \
  -H "X-API-Key: h2p_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<h1 style=\"color: blue;\">Hello World</h1>",
    "width": 800,
    "dpr": 2
  }' \
  --output screenshot.png
```

### JavaScript
```javascript
const response = await fetch('http://localhost:3000/api/convert', {
  method: 'POST',
  headers: {
    'X-API-Key': 'h2p_your_api_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    html: '<h1>Hello World</h1>',
    width: 1200,
    dpr: 2,
  }),
});

const buffer = await response.arrayBuffer();
fs.writeFileSync('screenshot.png', Buffer.from(buffer));
```

### Python
```python
import requests

response = requests.post(
    'http://localhost:3000/api/convert',
    headers={
        'X-API-Key': 'h2p_your_api_key',
        'Content-Type': 'application/json',
    },
    json={
        'html': '<h1>Hello World</h1>',
        'width': 1200,
        'dpr': 2,
    },
)

with open('screenshot.png', 'wb') as f:
    f.write(response.content)
```

## Tech Stack

- **Framework**: Next.js 15 (React 19)
- **Screenshot Engine**: Playwright
- **Database**: SQLite (better-sqlite3)
- **Styling**: TailwindCSS
- **Container**: Docker with Playwright base image

## License

MIT
