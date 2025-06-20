import { NextRequest, NextResponse } from 'next/server';
import { generateTaskDescription } from '@/lib/openai';

// POST metodu - AI görev açıklaması oluştur
export async function POST(request: NextRequest) {
  try {
    // İstek gövdesinden görev başlığını al
    const { title } = await request.json();

    // Giriş kontrolü
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Geçerli bir görev başlığı girmeniz gerekiyor' },
        { status: 400 }
      );
    }

    // Çok uzun başlık kontrolü
    if (title.length > 100) {
      return NextResponse.json(
        { error: 'Görev başlığı en fazla 100 karakter olabilir' },
        { status: 400 }
      );
    }

    // OpenAI API anahtarı kontrolü
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI servisi şu anda kullanılamıyor' },
        { status: 503 }
      );
    }

    // AI açıklamasını oluştur
    const description = await generateTaskDescription(title.trim());

    // Başarılı yanıt döndür
    return NextResponse.json({
      description,
      title: title.trim(),
    });

  } catch (error) {
    // Hata durumunda detaylı log
    console.error('AI açıklama API hatası:', error);
    
    return NextResponse.json(
      { error: 'AI açıklaması oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
} 