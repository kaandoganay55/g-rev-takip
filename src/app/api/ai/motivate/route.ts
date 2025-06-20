import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST metodu - AI motivasyon mesajları
export async function POST(request: NextRequest) {
  try {
    // İstek gövdesinden kullanıcı bilgilerini al
    const { completedTasks, pendingTasks, mood, userName } = await request.json();

    // OpenAI API anahtarı kontrolü
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI servisi şu anda kullanılamıyor' },
        { status: 503 }
      );
    }

    // Kullanıcı verilerini analiz et
    const completed = completedTasks || 0;
    const pending = pendingTasks || 0;
    const userMood = mood || 'normal';
    const name = userName || 'Kullanıcı';

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Sen pozitif ve motive edici bir verimlilik koçusun. Kullanıcının görev durumuna ve ruh haline göre kişiselleştirilmiş motivasyon mesajları oluştur. 
          JSON formatında yanıt ver:
          {
            "motivationMessage": "Ana motivasyon mesajı",
            "tip": "Günlük verimlilik ipucu", 
            "encouragement": "Teşvik edici kısa mesaj",
            "nextAction": "Önerilen sonraki eylem"
          }
          Türkçe, samimi ve cesaretlendirici bir dil kullan.`
        },
        {
          role: "user",
          content: `Kullanıcı: ${name}
          Tamamlanan görevler: ${completed}
          Bekleyen görevler: ${pending}
          Ruh hali: ${userMood}
          
          Bu kullanıcı için motivasyon mesajı oluştur.`
        }
      ],
      max_tokens: 400,
      temperature: 0.8,
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      return NextResponse.json(
        { error: 'Motivasyon mesajı oluşturulamadı' },
        { status: 500 }
      );
    }

    try {
      const motivation = JSON.parse(result);
      return NextResponse.json({
        motivationMessage: motivation.motivationMessage || 'Harika gidiyorsun! 💪',
        tip: motivation.tip || 'Küçük adımlarla büyük hedeflere ulaşırsın.',
        encouragement: motivation.encouragement || 'Sen başarabilirsin! 🌟',
        nextAction: motivation.nextAction || 'Bir sonraki göreve odaklan.',
        stats: {
          completed,
          pending,
          mood: userMood
        }
      });
    } catch {
      // JSON parse edilemezse varsayılan mesajlar döndür
      return NextResponse.json({
        motivationMessage: `Merhaba ${name}! ${completed} görev tamamladın, harika! 🎉`,
        tip: 'Hedeflerine odaklan ve küçük adımlarla ilerlemeye devam et.',
        encouragement: 'Sen harikasın! Devam et! 💪',
        nextAction: 'Bir sonraki öncelikli görevi seç ve başla.',
        stats: {
          completed,
          pending,
          mood: userMood
        }
      });
    }

  } catch (error) {
    console.error('AI motivasyon API hatası:', error);
    
    return NextResponse.json(
      { error: 'Motivasyon mesajı oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
} 