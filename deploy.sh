#!/bin/bash

# NewsBrowser 一键部署脚本
# 适用于 Linux 服务器

echo "🚀 开始部署 NewsBrowser..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js"
    echo "安装命令："
    echo "  Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "  CentOS/RHEL: curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - && yum install -y nodejs"
    exit 1
fi

echo "✅ Node.js 版本：$(node -v)"

# 安装依赖
echo "📦 安装依赖..."
npm install --production

# 检查防火墙
if command -v ufw &> /dev/null; then
    echo "🔥 配置 UFW 防火墙..."
    sudo ufw allow 3000/tcp
    sudo ufw reload
elif command -v firewall-cmd &> /dev/null; then
    echo "🔥 配置 firewalld..."
    sudo firewall-cmd --permanent --add-port=3000/tcp
    sudo firewall-cmd --reload
else
    echo "⚠️  未检测到常见防火墙，请手动配置或确保端口 3000 已开放"
fi

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi

# 使用 PM2 启动
echo "🚀 启动服务..."
pm2 delete news-browser 2>/dev/null || true
pm2 start server.js --name news-browser
pm2 save
pm2 startup | tail -n 1 | bash 2>/dev/null

echo ""
echo "✅ 部署完成！"
echo ""
echo "📊 服务状态:"
pm2 status
echo ""
echo "🌐 访问地址：http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "💡 常用命令:"
echo "  查看日志：pm2 logs news-browser"
echo "  重启服务：pm2 restart news-browser"
echo "  停止服务：pm2 stop news-browser"
echo "  查看状态：pm2 status"
