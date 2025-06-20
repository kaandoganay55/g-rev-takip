import { NextRequest, NextResponse } from 'next/server';
import { suggestTaskCategory } from '@/lib/openai';

// POST metodu - AI görev kategorisi önerisi
export async function POST(request: NextRequest) {
  try {
    // İstek gövdesinden görev bilgilerini al
    const { title, description } = await request.json();

    // Giriş kontrolü
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Geçerli bir görev başlığı girmeniz gerekiyor' },
        { status: 400 }
      );
    }

    // Açıklama kontrolü (opsiyonel)
    const desc = description && typeof description === 'string' ? description.trim() : '';

    // OpenAI API anahtarı kontrolü
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI servisi şu anda kullanılamıyor' },
        { status: 503 }
      );
    }

    // AI kategori önerilerini al
    const categories = await suggestTaskCategory(title.trim(), desc);

    // Başarılı yanıt döndür
    return NextResponse.json({
      categories,
      title: title.trim(),
      description: desc,
    });

  } catch (error) {
    // Hata durumunda detaylı log
    console.error('AI kategori önerisi API hatası:', error);
    
    return NextResponse.json(
      { error: 'AI kategori önerisi yapılırken hata oluştu' },
      { status: 500 }
    );
  }
} 