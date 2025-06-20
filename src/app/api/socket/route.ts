import { NextRequest, NextResponse } from 'next/server';
import { initSocket, NextApiResponseServerIo } from '@/lib/socket';

export async function GET(req: NextRequest) {
  // Socket.io initialize etmek için geçici bir response objesi oluştur
  const res = {
    socket: {
      server: (global as any).httpServer || {}
    }
  } as NextApiResponseServerIo;

  try {
    initSocket(res);
    return NextResponse.json({ message: 'Socket.io initialized' });
  } catch (error) {
    console.error('Socket.io initialization error:', error);
    return NextResponse.json({ error: 'Failed to initialize socket' }, { status: 500 });
  }
} 