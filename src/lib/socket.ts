import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';

export type NextApiResponseServerIo = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

export const initSocket = (res: NextApiResponseServerIo) => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.io...');
    const io = new ServerIO(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('🔌 New client connected:', socket.id);

      // Kullanıcı odalarına katılma
      socket.on('join-user', (userId: string) => {
        socket.join(`user-${userId}`);
        console.log(`📥 User ${userId} joined room`);
      });

      // Bildirim gönderme
      socket.on('send-notification', (data: { userId: string; notification: any }) => {
        io.to(`user-${data.userId}`).emit('notification', data.notification);
      });

      socket.on('disconnect', () => {
        console.log('📤 Client disconnected:', socket.id);
      });
    });
  }

  return res.socket.server.io;
};

// Bildirim türleri
export type NotificationType = 'task_completed' | 'task_added' | 'deadline_warning' | 'ai_suggestion' | 'task_assigned';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  createdAt: Date;
  read: boolean;
  data?: any; // Ek veri (task id vs.)
} 