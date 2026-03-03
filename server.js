import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 数据文件路径
const DATA_FILE = join(__dirname, 'data', 'urls.json');

// 确保数据目录存在
const dataDir = join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化 URL 数据
if (!fs.existsSync(DATA_FILE)) {
  const defaultUrls = [
    { id: 1, name: '百度', url: 'https://www.baidu.com' },
    { id: 2, name: '谷歌', url: 'https://www.google.com' },
    { id: 3, name: '知乎', url: 'https://www.zhihu.com' },
    { id: 4, name: 'GitHub', url: 'https://github.com' },
    { id: 5, name: 'CSDN', url: 'https://www.csdn.net' }
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaultUrls, null, 2));
}

// API: 获取所有 URL
app.get('/api/urls', (req, res) => {
  try {
    const urls = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    res.json(urls);
  } catch (error) {
    res.status(500).json({ error: '读取数据失败' });
  }
});

// API: 添加 URL
app.post('/api/urls', (req, res) => {
  try {
    const { name, url } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ error: '名称和地址不能为空' });
    }

    // 简单的 URL 验证
    let validUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      validUrl = 'https://' + url;
    }

    const urls = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const newId = urls.length > 0 ? Math.max(...urls.map(u => u.id)) + 1 : 1;
    
    const newUrl = {
      id: newId,
      name,
      url: validUrl
    };
    
    urls.push(newUrl);
    fs.writeFileSync(DATA_FILE, JSON.stringify(urls, null, 2));
    
    res.status(201).json(newUrl);
  } catch (error) {
    res.status(500).json({ error: '添加失败' });
  }
});

// API: 删除 URL
app.delete('/api/urls/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const urls = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const filtered = urls.filter(u => u.id !== id);
    
    if (filtered.length === urls.length) {
      return res.status(404).json({ error: '未找到该 URL' });
    }
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2));
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
});

// API: 更新 URL
app.put('/api/urls/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, url } = req.body;
    
    const urls = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const index = urls.findIndex(u => u.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: '未找到该 URL' });
    }
    
    if (name) urls[index].name = name;
    if (url) {
      let validUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        validUrl = 'https://' + url;
      }
      urls[index].url = validUrl;
    }
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(urls, null, 2));
    res.json(urls[index]);
  } catch (error) {
    res.status(500).json({ error: '更新失败' });
  }
});

// API: 检查 URL 可访问性
app.get('/api/check-url', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL 不能为空' });
  }

  try {
    // 使用 fetch 检查 URL（需要 Node 18+）
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 5000 
    });
    
    res.json({ 
      accessible: response.ok,
      status: response.status,
      supportsIframe: !response.headers.get('x-frame-options') || response.headers.get('x-frame-options') === 'SAMEORIGIN'
    });
  } catch (error) {
    res.json({ 
      accessible: false,
      error: error.message,
      message: '无法访问该网站'
    });
  }
});

// API: 通过代理访问 URL（解决跨域和安全限制问题）
app.get('/api/proxy', (req, res) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL 不能为空' });
  }

  // 验证 URL 格式
  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (error) {
    return res.status(400).json({ error: '无效的 URL 格式' });
  }

  // 只允许 http 和 https 协议
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return res.status(403).json({ error: '只支持 HTTP 和 HTTPS 协议' });
  }

  const client = parsedUrl.protocol === 'https:' ? https : http;
  
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    },
    timeout: 15000,
    rejectUnauthorized: false // 忽略 SSL 证书错误
  };

  const proxyReq = client.request(options, (proxyRes) => {
    // 设置响应头，允许跨域访问
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // 转发状态码
    res.statusCode = proxyRes.statusCode;
    
    // 转发响应头（过滤一些不安全的头）
    Object.keys(proxyRes.headers).forEach(key => {
      if (key !== 'transfer-encoding' && key !== 'connection') {
        res.setHeader(key, proxyRes.headers[key]);
      }
    });
    
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    console.error('代理请求错误:', error);
    res.status(500).json({ 
      error: '代理请求失败',
      message: error.message 
    });
  });

  proxyReq.on('timeout', () => {
    proxyReq.abort();
    res.status(504).json({ 
      error: '网关超时',
      message: '目标服务器响应超时' 
    });
  });

  proxyReq.end();
});

// OPTIONS 预检请求
app.options('/api/proxy', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

app.listen(PORT, HOST, () => {
  console.log(`服务器运行在 http://${HOST}:${PORT}`);
  console.log(`本地访问：http://localhost:${PORT}`);
  console.log(`外网访问：http://<服务器 IP>:${PORT}`);
  console.log(`\n提示：如果无法访问，请检查防火墙设置`);
  console.log(`Linux 防火墙命令：sudo ufw allow ${PORT}/tcp`);
});
