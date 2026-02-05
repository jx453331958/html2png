# HTML 转 PNG 工具

一个自托管的 HTML 转高质量 PNG 图片服务。

[English](./README.md)

## 功能特性

- HTML 转 PNG，支持自定义视窗大小
- 支持设备像素比 (1x, 2x, 3x) 以适配高清屏幕
- 全页截图选项
- JWT 用户认证
- API 密钥管理，支持编程访问
- 请求频率限制保护
- 多语言支持（英文、中文）
- Docker 部署支持

## 快速开始

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/yourusername/html2png.git
cd html2png

# 运行安装脚本
./scripts/dev.sh

# 启动服务
cd server && npm run dev
```

服务将在 `http://localhost:3000` 可用。

### Docker 部署

```bash
cd docker

# 构建并运行
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## API 接口文档

### 认证方式

所有 API 接口（健康检查除外）需要通过以下方式之一进行认证：
- **JWT Token**: 在请求头中传入 `Authorization: Bearer <token>`
- **API Key**: 在请求头中传入 `X-API-Key: <key>`

### 接口列表

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

#### HTML 转 PNG
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

**参数说明:**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| html | string | (必填) | 要转换的 HTML 内容 |
| width | number | 1200 | 视窗宽度，单位像素 (100-4096) |
| height | number | 自动 | 视窗高度，单位像素 (100-10000) |
| dpr | number | 1 | 设备像素比 (1, 2, 或 3) |
| fullPage | boolean | false | 是否截取整个可滚动页面 |

**响应:** PNG 图片二进制数据

#### 获取 API 密钥列表
```http
GET /api/keys
Authorization: Bearer <token>
```

#### 创建 API 密钥
```http
POST /api/keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "我的应用密钥"
}
```

#### 删除 API 密钥
```http
DELETE /api/keys/:id
Authorization: Bearer <token>
```

## 配置说明

环境变量（参见 `.env.example`）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| PORT | 3000 | 服务端口 |
| HOST | 0.0.0.0 | 服务主机 |
| JWT_SECRET | - | JWT 签名密钥（生产环境必须设置） |
| DATABASE_PATH | ./data/html2png.db | SQLite 数据库路径 |
| RATE_LIMIT_MAX | 100 | 时间窗口内最大请求数 |
| RATE_LIMIT_WINDOW_MS | 60000 | 频率限制时间窗口（毫秒） |

## 使用示例

### cURL
```bash
curl -X POST http://localhost:3000/api/convert \
  -H "X-API-Key: h2p_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<h1 style=\"color: blue;\">你好世界</h1>",
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
    html: '<h1>你好世界</h1>',
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
        'html': '<h1>你好世界</h1>',
        'width': 1200,
        'dpr': 2,
    },
)

with open('screenshot.png', 'wb') as f:
    f.write(response.content)
```

## 技术栈

- **后端**: Node.js, Fastify, Playwright
- **前端**: 原生 HTML, Alpine.js, TailwindCSS
- **数据库**: SQLite (better-sqlite3)
- **容器**: Docker（基于 Playwright 镜像）

## 开源协议

MIT
