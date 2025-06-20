import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST metodu - AI görev planlama
export async function POST(request: NextRequest) {
  try {
    // İstek gövdesinden görevleri al
    const { tasks, preferences } = await request.json();

    // Giriş kontrolü
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: 'En az bir görev girmeniz gerekiyor' },
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

    // Tercihleri hazırla
    const userPrefs = preferences || {};
    const workingHours = userPrefs.workingHours || '09:00-18:00';
    const availableDays = userPrefs.availableDays || 5;
    const maxTasksPerDay = userPrefs.maxTasksPerDay || 3;

    // Görevleri string'e çevir
    const taskList = tasks.map((task: any, index: number) => 
      `${index + 1}. ${task.title} (Öncelik: ${task.priority || 'orta'})`
    ).join('\n');

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Sen bir verimlilik uzmanısın. Verilen görevleri kullanıcının tercihlerine göre günlük plana yerleştir. 
          JSON formatında yanıt ver: 
          {
            "schedule": [
              {
                "day": "Pazartesi",
                "tasks": [
                  {"title": "Görev adı", "time": "09:00", "duration": "1 saat", "priority": "yüksek"}
                ]
              }
            ],
            "tips": ["İpucu 1", "İpucu 2"]
          }
          Türkçe yanıtla.`
        },
        {
          role: "user",
          content: `Şu görevleri planla:
          ${taskList}
          
          Tercihlerim:
          - Çalışma saatleri: ${workingHours}
          - Mevcut günler: ${availableDays} gün
          - Günlük maksimum görev: ${maxTasksPerDay}
          
          Bu görevleri verimli bir şekilde planla.`
        }
      ],
      max_tokens: 800,
      temperature: 0.6,
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      return NextResponse.json(
        { error: 'AI planlaması oluşturulamadı' },
        { status: 500 }
      );
    }

    try {
      const schedule = JSON.parse(result);
      return NextResponse.json({
        schedule: schedule.schedule || [],
        tips: schedule.tips || [],
        preferences: userPrefs,
      });
    } catch {
      return NextResponse.json(
        { error: 'AI yanıtı işlenemedi' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('AI planlama API hatası:', error);
    
    return NextResponse.json(
      { error: 'AI planlaması yapılırken hata oluştu' },
      { status: 500 }
    );
  }
} 