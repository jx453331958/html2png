# HTML to PNG Converter

A self-hosted service to convert HTML content to high-quality PNG images.

[中文文档](./README.zh-CN.md)

## Features

- Convert HTML to PNG with customizable viewport size
- Support for Device Pixel Ratio (1x, 2x, 3x) for high-DPI displays
- Full page screenshot option
- User authentication with JWT
- API key management for programmatic access
- Rate limiting protection
- Multi-language support (English, Chinese)
- Docker deployment ready

## Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/html2png.git
cd html2png

# Run setup script
./scripts/dev.sh

# Start the server
cd server && npm run dev
```

The server will be available at `http://localhost:3000`.

### Docker Deployment

```bash
cd docker

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

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

## Configuration

Environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| HOST | 0.0.0.0 | Server host |
| JWT_SECRET | - | Secret for JWT signing (required in production) |
| DATABASE_PATH | ./data/html2png.db | SQLite database path |
| RATE_LIMIT_MAX | 100 | Max requests per window |
| RATE_LIMIT_WINDOW_MS | 60000 | Rate limit window in ms |

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

- **Backend**: Node.js, Fastify, Playwright
- **Frontend**: Vanilla HTML, Alpine.js, TailwindCSS
- **Database**: SQLite (better-sqlite3)
- **Container**: Docker with Playwright base image

## License

MIT
