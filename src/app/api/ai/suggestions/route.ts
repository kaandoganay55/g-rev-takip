import { NextRequest, NextResponse } from 'next/server';
import { generateTaskSuggestions } from '@/lib/openai';

// POST metodu - AI görev önerileri al
export async function POST(request: NextRequest) {
  try {
    // İstek gövdesinden kullanıcı girdisini ve görev sayısını al
    const { userInput, count } = await request.json();

    // Giriş kontrolü
    if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
      return NextResponse.json(
        { error: 'Geçerli bir konu girmeniz gerekiyor' },
        { status: 400 }
      );
    }

    // Çok uzun girdi kontrolü
    if (userInput.length > 200) {
      return NextResponse.json(
        { error: 'Konu en fazla 200 karakter olabilir' },
        { status: 400 }
      );
    }

    // Görev sayısı kontrolü
    const taskCount = count && typeof count === 'number' ? Math.min(Math.max(count, 1), 10) : 5;

    // OpenAI API anahtarı kontrolü
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI servisi şu anda kullanılamıyor' },
        { status: 503 }
      );
    }

    // AI önerilerini oluştur
    const suggestions = await generateTaskSuggestions(userInput.trim(), taskCount);

    // Başarılı yanıt döndür
    return NextResponse.json({
      suggestions,
      userInput: userInput.trim(),
      count: taskCount,
    });

  } catch (error) {
    // Hata durumunda detaylı log
    console.error('AI önerileri API hatası:', error);
    
    return NextResponse.json(
      { error: 'AI önerileri oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
} 