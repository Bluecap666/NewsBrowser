# 服务器部署指南

## 🚀 部署步骤

### 1. 上传项目到服务器

```bash
# 方法 1: 使用git clone
git clone https://github.com/Bluecap666/NewsBrowser.git
cd NewsBrowser

# 方法 2: 使用 scp 上传
scp -r ./project root@64.2.2.1:/path/to/deploy
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动服务

```bash
# 直接启动
npm start

# 或使用 PM2（推荐，可后台运行）
npm install -g pm2
pm2 start server.js --name news-browser
pm2 save
pm2 startup
```

### 4. 配置防火墙

**Linux (UFW)**:
```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

**Linux (firewalld)**:
```bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

**Windows 防火墙**:
```powershell
# 在服务器上以管理员身份运行
netsh advfirewall firewall add rule name="NewsBrowser" dir=in action=allow protocol=TCP localport=3000
```

### 5. 访问应用

- **外网访问**: http://64.2.2.1:3000
- **本地访问**: http://localhost:3000

## 🔧 配置选项

### 修改端口

如果 3000 端口被占用，可以：

**方法 1**: 修改 `server.js` 中的 PORT 值
```javascript
const PORT = 8080; // 改为其他端口
```

**方法 2**: 使用环境变量
```bash
export PORT=8080
npm start
```

**方法 3**: 使用 PM2
```bash
pm2 start server.js --name news-browser --env PORT=8080
```

### 使用 Nginx 反向代理（推荐）

如果需要更安全的部署：

1. 安装 Nginx
```bash
sudo apt install nginx  # Ubuntu/Debian
sudo yum install nginx  # CentOS/RHEL
```

2. 配置 Nginx
```nginx
server {
    listen 80;
    server_name 64.2.2.1;

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

3. 重启 Nginx
```bash
sudo systemctl restart nginx
```

## 🐛 故障排查

### 检查服务是否运行

```bash
# 查看 Node.js 进程
ps aux | grep node

# 查看端口占用
netstat -tulpn | grep 3000

# 或使用 lsof
lsof -i :3000
```

### 查看日志

```bash
# 如果使用 PM2
pm2 logs news-browser

# 直接查看
tail -f ~/.pm2/logs/news-browser-out.log
```

### 测试连接

在服务器上测试：
```bash
curl http://localhost:3000
```

从外部测试：
```bash
curl http://64.2.2.1:3000
```

### 常见问题

**问题 1**: 连接被拒绝
- ✅ 检查防火墙是否开放了端口
- ✅ 确认服务器监听在 0.0.0.0 而不是 localhost
- ✅ 检查云服务器安全组规则

**问题 2**: 无法访问国外网站
- ✅ 开启页面顶部的代理开关
- ✅ 检查服务器网络连通性

**问题 3**: 服务自动停止
- ✅ 使用 PM2 管理进程
- ✅ 查看错误日志定位问题

## 📝 更新项目

```bash
# 拉取最新代码
git pull origin main

# 重新安装依赖（如果有更新）
npm install

# 重启服务
pm2 restart news-browser
# 或
npm start
```

## 🔒 安全建议

1. **配置 HTTPS**（强烈推荐）
   - 使用 Let's Encrypt 免费证书
   - 通过 Nginx 配置 SSL

2. **限制访问 IP**
   - 在防火墙中设置白名单
   - 或在应用中添加 IP 验证

3. **定期备份数据**
   - 备份 `data/urls.json` 文件
   - 设置定时任务自动备份

4. **监控服务状态**
   - 使用 PM2 监控
   - 配置告警通知

## 📞 技术支持

如有问题，请提交 Issue 到 GitHub 仓库。
