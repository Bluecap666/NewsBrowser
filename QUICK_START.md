# 64.2.2.1 服务器快速部署指南

## 🎯 问题已解决

**原问题**: 服务器拒绝连接请求  
**原因**: 服务器监听在 `localhost`，只能从本机访问  
**解决方案**: 修改为监听 `0.0.0.0`，允许所有网络接口访问

---

## ⚡ 快速部署（3 步完成）

### 步骤 1: 上传项目到服务器

```bash
# SSH 登录到服务器
ssh root@64.2.2.1

# 克隆项目
cd /var/www
git clone https://github.com/Bluecap666/NewsBrowser.git
cd NewsBrowser
```

### 步骤 2: 运行一键部署脚本

```bash
chmod +x deploy.sh
./deploy.sh
```

### 步骤 3: 验证访问

```bash
# 在服务器上测试
curl http://localhost:3000

# 查看服务状态
pm2 status
```

现在可以在浏览器访问：**http://64.2.2.1:3000**

---

## 🔧 手动部署（如果自动脚本失败）

### 1. 安装 Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
sudo yum install -y nodejs
```

### 2. 安装依赖

```bash
npm install --production
```

### 3. 配置防火墙

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 3000/tcp
sudo ufw reload

# firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 4. 启动服务

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name news-browser

# 设置开机自启
pm2 save
pm2 startup | tail -n 1 | bash
```

---

## 🐛 故障排查

### 检查端口是否开放

```bash
# 查看端口占用
netstat -tulpn | grep 3000

# 应该看到 0.0.0.0:3000 或 :::3000
```

### 测试网络连接

```bash
# 在服务器上测试
curl http://localhost:3000

# 从外部测试（在自己的电脑上）
curl http://64.2.2.1:3000
```

### 查看日志

```bash
# PM2 日志
pm2 logs news-browser

# 实时查看
pm2 logs news-browser --lines 100
```

### 常见问题

#### 1. 仍然无法访问

```bash
# 检查云服务器安全组
# 如果是云服务器（阿里云、腾讯云等），需要在控制台开放 3000 端口

# 检查 iptables
sudo iptables -L -n | grep 3000
```

#### 2. 端口被占用

```bash
# 修改端口
export PORT=8080
pm2 restart news-browser --env PORT=8080
```

#### 3. 权限问题

```bash
# 确保有执行权限
chmod +x server.js
chmod -R 755 /var/www/NewsBrowser
```

---

## 📊 部署后的管理命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启服务
pm2 restart news-browser

# 停止服务
pm2 stop news-browser

# 删除服务
pm2 delete news-browser

# 查看内存占用
pm2 monit
```

---

## 🔒 安全加固建议

### 1. 使用 Nginx 反向代理

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 2. 配置 HTTPS（推荐）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

### 3. 限制访问 IP

```bash
# UFW 限制特定 IP
sudo ufw allow from 192.168.1.0/24 to any port 3000

# 或删除允许规则
sudo ufw delete allow from 192.168.1.0/24 to any port 3000
```

---

## 📝 更新项目

```bash
# 进入项目目录
cd /var/www/NewsBrowser

# 拉取最新代码
git pull origin main

# 重启服务
pm2 restart news-browser
```

---

## ✅ 验证清单

- [ ] 服务器可以访问 `http://localhost:3000`
- [ ] 本地电脑可以访问 `http://64.2.2.1:3000`
- [ ] 页面正常显示
- [ ] 可以添加/删除网站链接
- [ ] 点击网站可以正常打开
- [ ] 代理功能正常工作
- [ ] PM2 服务状态正常
- [ ] 防火墙已正确配置

---

## 📞 需要帮助？

如果遇到问题：

1. 查看详细部署文档：`DEPLOY.md`
2. 查看 PM2 日志：`pm2 logs news-browser`
3. GitHub Issues: https://github.com/Bluecap666/NewsBrowser/issues

---

**祝部署顺利！** 🎉
