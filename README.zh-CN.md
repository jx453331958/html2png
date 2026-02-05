# HTML 转 PNG 工具

一个自托管的 HTML 转高质量 PNG 图片服务。

[English](./README.md)

## 功能特性

- HTML 转 PNG，支持自定义视窗大小
- 支持设备像素比 (1x, 2x, 3x) 以适配高清屏幕
- 全页截图选项
- 支持上传 HTML 文件
- JWT 用户认证
- API 密钥管理，支持编程访问
- 管理员后台，可控制用户注册
- 请求频率限制保护
- 多语言支持（英文、中文）
- Docker 部署支持

## 快速开始

### 一键部署（推荐）

```bash
# 克隆仓库
git clone git@github.com:jx453331958/html2png.git
cd html2png

# 运行部署脚本
./deploy.sh
```

脚本会引导你完成以下配置：
1. 设置 JWT 密钥（留空则自动生成）
2. 创建管理员账号
3. 配置服务端口
4. 构建并启动 Docker 容器

### 手动 Docker 部署

```bash
# 克隆仓库
git clone git@github.com:jx453331958/html2png.git
cd html2png/docker

# 创建 .env 文件
cat > .env << EOF
JWT_SECRET=你的安全随机密钥
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=你的安全密码
EOF

# 启动服务
docker-compose up -d
```

### 本地开发

```bash
# 克隆仓库
git clone git@github.com:jx453331958/html2png.git
cd html2png/web

# 安装依赖
npm install

# 创建 .env 文件
cat > .env << EOF
PORT=3000
HOST=0.0.0.0
JWT_SECRET=dev-secret-key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
EOF

# 启动开发服务器
npm run dev
```

## 配置说明

环境变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| PORT | 3000 | 服务端口 |
| HOST | 0.0.0.0 | 服务主机 |
| JWT_SECRET | - | JWT 签名密钥（必填） |
| ADMIN_EMAIL | - | 管理员账号邮箱 |
| ADMIN_PASSWORD | - | 管理员账号密码 |
| DATABASE_PATH | ./data/html2png.db | SQLite 数据库路径 |
| RATE_LIMIT_MAX | 100 | 时间窗口内最大请求数 |
| RATE_LIMIT_WINDOW_MS | 60000 | 频率限制时间窗口（毫秒） |

## API 接口文档

### 认证方式

所有 API 接口需要通过以下方式之一进行认证：
- **JWT Token**: 请求头 `Authorization: Bearer <token>`
- **API Key**: 请求头 `X-API-Key: <key>`

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
注意：需要管理员先开启注册功能。

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

#### API 密钥管理
```http
GET    /api/keys          # 获取密钥列表
POST   /api/keys          # 创建密钥
DELETE /api/keys/:id      # 删除密钥
```

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

### JavaScript
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

- **框架**: Next.js 15 (React 19)
- **截图引擎**: Playwright
- **数据库**: SQLite (better-sqlite3)
- **样式**: TailwindCSS
- **容器**: Docker（基于 Playwright 镜像）

## 开源协议

MIT
