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

### Docker Deployment (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/yourusername/html2png.git
cd html2png/docker
```

2. Create `.env` file with your configuration:
```bash
# Required
JWT_SECRET=your-secure-random-secret-key

# Admin account (created on first startup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
```

3. Start the service:
```bash
docker-compose up -d
```

4. Access the service at `http://localhost:3000`

5. Login with your admin account and enable user registration in the Admin panel if needed.

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/html2png.git
cd html2png/web

# Install dependencies
npm install

# Create .env file
cp ../.env.example .env
# Edit .env with your settings

# Start development server
npm run dev
```

## Configuration

Environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| HOST | 0.0.0.0 | Server host |
| JWT_SECRET | - | Secret for JWT signing (required in production) |
| ADMIN_EMAIL | - | Admin account email (created on first startup) |
| ADMIN_PASSWORD | - | Admin account password |
| DATABASE_PATH | ./data/html2png.db | SQLite database path |
| RATE_LIMIT_MAX | 100 | Max requests per window |
| RATE_LIMIT_WINDOW_MS | 60000 | Rate limit window in ms |

## API Reference

### Authentication

All API endpoints (except health check) require authentication via:
- **JWT Token**: Pass in `Authorization: Bearer <token>` header
- **API Key**: Pass in `X-API-Key: <key>` header

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

#### List API Keys
```http
GET /api/keys
Authorization: Bearer <token>
```

#### Create API Key
```http
POST /api/keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My App Key"
}
```

#### Delete API Key
```http
DELETE /api/keys/:id
Authorization: Bearer <token>
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

### JavaScript (Node.js)
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
