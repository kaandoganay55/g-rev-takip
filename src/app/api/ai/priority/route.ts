import { NextRequest, NextResponse } from 'next/server';
import { analyzeTaskPriority } from '@/lib/openai';

// POST metodu - AI görev öncelik analizi
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

    // AI öncelik analizini yap
    const analysis = await analyzeTaskPriority(title.trim(), desc);

    // Başarılı yanıt döndür
    return NextResponse.json({
      priority: analysis.priority,
      reasoning: analysis.reasoning,
      title: title.trim(),
      description: desc,
    });

  } catch (error) {
    // Hata durumunda detaylı log
    console.error('AI öncelik analizi API hatası:', error);
    
    return NextResponse.json(
      { error: 'AI öncelik analizi yapılırken hata oluştu' },
      { status: 500 }
    );
  }
} 