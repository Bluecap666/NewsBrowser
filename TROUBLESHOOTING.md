# 解决"连接被阻止"问题指南

## 📋 问题说明

**错误信息**：此连接已被阻止，因为它是公共页面发起的，旨在连接到您本地网络上的设备或服务器。

**原因**：现代浏览器（Chrome、Edge 等）的安全策略阻止从公网 IP 访问本地服务，这是为了防止 DNS 重绑定攻击。

---

## ✅ 解决方案

### 方案 1：使用代理模式（推荐）

#### 步骤：

1. **打开应用**
   - 访问：`http://64.8.1.4:3000`

2. **启用代理开关**
   - 在页面顶部找到代理开关
   - 切换到"开启"状态（绿色）

3. **点击要访问的网站**
   - 系统会自动在新窗口打开代理页面
   - 避免浏览器的跨域限制

4. **如果仍然无法访问**
   - 点击"直接访问目标网站"按钮
   - 会在新标签页直接打开目标网站

---

### 方案 2：使用 HTTPS（需要额外配置）

浏览器对 HTTP 和 HTTPS 有不同的安全策略，使用 HTTPS 可以减少一些限制。

#### 步骤：

1. **安装 SSL 证书**（推荐使用 Let's Encrypt）
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

2. **配置 Nginx 反向代理**
```nginx
server {
    listen 443 ssl;
    server_name 64.8.1.4;
    
    ssl_certificate /etc/letsencrypt/live/your-domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **访问 HTTPS 版本**
   - `https://64.8.1.4:443`

---

### 方案 3：添加浏览器例外（仅限测试）

⚠️ **仅用于开发测试，不推荐生产环境**

#### Chrome 浏览器：

1. 打开 Chrome，访问：`chrome://flags/#insecure-private-network-apis`
2. 设置为"Disabled"
3. 重启浏览器

或者启动时添加参数：
```bash
chrome --disable-features=PrivateNetworkAccessSendPreflight
```

---

## 🔍 故障排查

### 检查服务器网络连接

在服务器上测试能否访问 Google：

```bash
# SSH 登录服务器
ssh root@64.8.1.4

# 测试访问 Google
curl -I https://www.google.com

# 如果无法访问，检查网络配置
ping 8.8.8.8
```

### 查看代理日志

```bash
# 查看 PM2 日志
pm2 logs news-browser --lines 50

# 实时查看
pm2 monit
```

### 常见错误及解决方法

#### 错误 1: "无法连接到目标网站"
- **原因**：服务器无法访问该网站
- **解决**：
  - 检查服务器网络连通性
  - 确认没有被防火墙阻止
  - 检查 DNS 解析是否正常

#### 错误 2: "SSL 证书错误"
- **原因**：目标网站 SSL 证书有问题
- **解决**：
  - 已在代码中设置 `rejectUnauthorized: false`
  - 自动忽略证书错误

#### 错误 3: "加载超时"
- **原因**：网络慢或网站响应慢
- **解决**：
  - 稍后重试
  - 使用"直接访问"按钮

---

## 💡 最佳实践

### 1. 使用建议

- ✅ **国内网站**：不需要开启代理
- ✅ **国外网站**：开启代理模式
- ✅ **Google/GitHub 等**：必须开启代理

### 2. 性能优化

```javascript
// 在 server.js 中已优化：
- 使用长连接（keep-alive）
- 支持 gzip 压缩
- 随机 User-Agent 避免被封
- 完整的浏览器标识
```

### 3. 安全建议

- ⚠️ 不要随意关闭代理开关访问不明网站
- ⚠️ 定期更新服务器系统和安全补丁
- ⚠️ 考虑配置防火墙白名单

---

## 📞 需要帮助？

### 检查清单

- [ ] 服务器可以正常上网
- [ ] 端口 3000 已开放
- [ ] PM2 服务正常运行
- [ ] 代理开关已打开
- [ ] 浏览器没有安装阻止插件

### 获取支持

1. **查看日志**
   ```bash
   pm2 logs news-browser
   ```

2. **测试连接**
   ```bash
   curl http://localhost:3000
   ```

3. **GitHub Issues**
   - https://github.com/Bluecap666/NewsBrowser/issues

---

## 🎯 快速验证

运行以下命令验证服务状态：

```bash
# 1. 检查进程
pm2 status

# 2. 检查端口
netstat -tulpn | grep 3000

# 3. 本地测试
curl http://localhost:3000

# 4. 外部测试（在自己的电脑）
curl http://64.8.1.4:3000
```

如果所有检查都通过，但浏览器仍然提示"连接被阻止"，请：

1. **刷新页面**
2. **清除浏览器缓存**
3. **使用无痕模式**
4. **开启代理模式**

---

**祝使用愉快！** 🎉
