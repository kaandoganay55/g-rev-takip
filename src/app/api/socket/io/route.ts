import { NextRequest, NextResponse } from 'next/server';
import { Server as ServerIO } from 'socket.io';
import { Server as NetServer } from 'http';

export async function GET() {
  return new NextResponse('Socket.io server should be running');
}

let io: ServerIO;

export async function POST(req: NextRequest) {
  if (!io) {
    // Socket.io sunucusunu başlat
    const httpServer = (global as any).httpServer;
    if (httpServer) {
      io = new ServerIO(httpServer, {
        path: '/api/socket/io',
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });

      io.on('connection', (socket) => {
        console.log('🔌 Socket connected:', socket.id);

        socket.on('join-user', (userId: string) => {
          socket.join(`user-${userId}`);
          console.log(`📥 User ${userId} joined room`);
        });

        socket.on('send-notification', (data) => {
          io.to(`user-${data.userId}`).emit('notification', data.notification);
          console.log(`📢 Notification sent to user ${data.userId}`);
        });

        socket.on('disconnect', () => {
          console.log('📤 Socket disconnected:', socket.id);
        });
      });
    }
  }

  return NextResponse.json({ message: 'Socket.io initialized' });
} 