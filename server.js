const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Socket.io setup
  const io = new Server(server, {
    path: '/api/socket',
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    // Kullanıcı odalarına katılma
    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`📥 User ${userId} joined room`);
    });

    // Bildirim gönderme
    socket.on('send-notification', (data) => {
      io.to(`user-${data.userId}`).emit('notification', data.notification);
      console.log(`📢 Notification sent to user ${data.userId}`);
    });

    socket.on('disconnect', () => {
      console.log('📤 Client disconnected:', socket.id);
    });
  });

  // Global olarak erişim için
  global.io = io;

  server
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`🚀 Server ready on http://${hostname}:${port}`);
      console.log(`🔌 Socket.io ready on path: /api/socket`);
    });
}); 