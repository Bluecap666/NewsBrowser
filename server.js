import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

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

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`访问地址：http://localhost:${PORT}`);
});
