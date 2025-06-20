import OpenAI from 'openai';

// OpenAI istemcisini yapılandır
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// OpenAI API anahtarının varlığını kontrol et
if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY environment variable is not set');
}

// Görev önerisi oluşturma fonksiyonu
export async function generateTaskSuggestions(userInput: string, count: number = 5): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Sen bir görev yönetimi asistanısın. Kullanıcının girdiği konuya göre ${count} adet pratik ve uygulanabilir görev önerisi oluştur. 
          Her öneri kısa, net ve eylem odaklı olmalı. Türkçe yanıtla.`
        },
        {
          role: "user", 
          content: `"${userInput}" konusuyla ilgili ${count} adet görev önerisi ver.`
        }
      ],
      max_tokens: Math.min(300 + count * 20, 800),
      temperature: 0.7,
    });

    const suggestions = response.choices[0]?.message?.content;
    if (!suggestions) {
      return ['AI önerisi oluşturulamadı'];
    }

    // Yanıtı satırlara böl ve temizle
    return suggestions
      .split('\n')
      .filter(line => line.trim() && (line.includes('-') || line.includes('•') || line.match(/^\d+\./)))
      .map(line => line.replace(/^[-•\d.]\s*/, '').trim())
      .slice(0, count); // İstenen sayıda öneri
      
  } catch (error) {
    console.error('OpenAI görev önerisi hatası:', error);
    return ['AI önerisi şu anda kullanılamıyor'];
  }
}

// Görev açıklaması oluşturma fonksiyonu
export async function generateTaskDescription(title: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Sen bir görev yönetimi asistanısın. Verilen görev başlığına göre kısa, net ve uygulanabilir bir görev açıklaması oluştur. 
          Açıklama 2-3 cümle olmalı ve nasıl yapılacağına dair ipuçları içermeli. Türkçe yanıtla.`
        },
        {
          role: "user",
          content: `"${title}" başlıklı görev için açıklama oluştur.`
        }
      ],
      max_tokens: 150,
      temperature: 0.6,
    });

    return response.choices[0]?.message?.content || 'AI açıklaması oluşturulamadı';
    
  } catch (error) {
    console.error('OpenAI açıklama oluşturma hatası:', error);
    return 'AI açıklaması şu anda kullanılamıyor';
  }
}

// Görev öncelik belirleme fonksiyonu
export async function analyzeTaskPriority(title: string, description: string): Promise<{
  priority: 'düşük' | 'orta' | 'yüksek' | 'acil';
  reasoning: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Sen bir görev analizi uzmanısın. Verilen görev başlığı ve açıklamasına göre görevin öncelik seviyesini belirle.
          Öncelik seviyeleri: düşük, orta, yüksek, acil
          Yanıtı JSON formatında ver: {"priority": "seviye", "reasoning": "açıklama"}
          Türkçe yanıtla.`
        },
        {
          role: "user",
          content: `Başlık: "${title}"\nAçıklama: "${description}"\n\nBu görevin öncelik seviyesini belirle.`
        }
      ],
      max_tokens: 100,
      temperature: 0.3,
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      return { priority: 'orta', reasoning: 'AI analizi yapılamadı' };
    }

    try {
      const parsed = JSON.parse(result);
      return {
        priority: parsed.priority || 'orta',
        reasoning: parsed.reasoning || 'AI analizi tamamlandı'
      };
    } catch {
      return { priority: 'orta', reasoning: 'AI yanıtı işlenemedi' };
    }
    
  } catch (error) {
    console.error('OpenAI öncelik analizi hatası:', error);
    return { priority: 'orta', reasoning: 'AI analizi şu anda kullanılamıyor' };
  }
}

// Görev kategorisi önerme fonksiyonu
export async function suggestTaskCategory(title: string, description: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Sen bir görev kategorilendirme uzmanısın. Verilen görev için en uygun 3 kategori öner.
          Kategoriler: İş, Kişisel, Eğitim, Sağlık, Alışveriş, Finans, Ev İşleri, Hobi, Sosyal, Teknoloji, Spor, Aile
          Yanıtı virgülle ayrılmış kategori listesi olarak ver. Türkçe yanıtla.`
        },
        {
          role: "user",
          content: `Başlık: "${title}"\nAçıklama: "${description}"\n\nBu görev için kategori öner.`
        }
      ],
      max_tokens: 50,
      temperature: 0.4,
    });

    const categories = response.choices[0]?.message?.content;
    if (!categories) {
      return ['Genel'];
    }

    return categories
      .split(',')
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0)
      .slice(0, 3);
      
  } catch (error) {
    console.error('OpenAI kategori önerisi hatası:', error);
    return ['Genel'];
  }
} 