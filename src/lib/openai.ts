/**
 * ============================================================================
 * OPENAI INTEGRATION SERVICE - YAPAY ZEKA ENTEGRASYONİ
 * ============================================================================
 * 
 * Bu dosya OpenAI GPT modelleri ile entegrasyonu yönetir.
 * Task Manager uygulaması için AI destekli özellikler sağlar:
 * 
 * Özellikler:
 * - Görev önerisi oluşturma (Task suggestions)
 * - Otomatik açıklama yazma (Description generation)  
 * - Öncelik analizi (Priority analysis)
 * - Kategori önerme (Category suggestions)
 * 
 * Model: GPT-3.5-turbo (cost-effective, fast)
 * Dil: Türkçe optimized prompts
 * Rate limiting: OpenAI API limitleri uygulanır
 * 
 * @requires openai - Official OpenAI Node.js library
 * @requires OPENAI_API_KEY - Environment variable
 */

import OpenAI from 'openai';

// ============ OPENAI CLIENT CONFIGURATION ============
// OpenAI istemcisini global olarak yapılandır
// Singleton pattern - tek instance kullanılır
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Environment variable'dan API key al
});

// ============ ENVIRONMENT VALIDATION ============
// OpenAI API anahtarının varlığını kontrol et
// Development ortamında erken uyarı için
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY environment variable is not set');
  console.warn('AI features will not work without API key');
}

/**
 * ============================================================================
 * GÖREV ÖNERİSİ OLUŞTURMA FONKSİYONU
 * ============================================================================
 * 
 * Kullanıcının girdiği konuya göre pratik görev önerileri oluşturur.
 * GPT-3.5-turbo modeli ile Türkçe prompt engineering kullanır.
 * 
 * @param userInput - Kullanıcının girdiği konu (örn: "ev temizliği")
 * @param count - Üretilecek öneri sayısı (default: 5, max: 10)
 * @returns Promise<string[]> - Görev önerileri dizisi
 * 
 * Örnek Kullanım:
 * generateTaskSuggestions("proje yönetimi", 3)
 * -> ["Proje planı oluştur", "Takım toplantısı düzenle", "İlerleme raporu hazırla"]
 */
export async function generateTaskSuggestions(userInput: string, count: number = 5): Promise<string[]> {
  try {
    // ============ OPENAI API CALL ============
    // Chat completion API ile görev önerileri oluştur
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Cost-effective model choice
      messages: [
        {
          role: "system", // AI'nın rolü ve davranış kuralları
          content: `Sen bir görev yönetimi asistanısın. Kullanıcının girdiği konuya göre ${count} adet pratik ve uygulanabilir görev önerisi oluştur. 
          
          KURALLAR:
          - Her öneri kısa, net ve eylem odaklı olmalı
          - Gerçekçi ve uygulanabilir olmalı
          - Türkçe yanıtla
          - Numaralandırma veya madde işareti kullan
          - Her öneri ayrı satırda olsun`
        },
        {
          role: "user", // Kullanıcının isteği
          content: `"${userInput}" konusuyla ilgili ${count} adet görev önerisi ver.`
        }
      ],
      max_tokens: Math.min(300 + count * 20, 800), // Dynamic token limit
      temperature: 0.7, // Yaratıcılık seviyesi (0-1 arası)
    });

    // ============ RESPONSE PROCESSING ============
    // AI'dan gelen yanıtı parse et ve temizle
    const suggestions = response.choices[0]?.message?.content;
    
    if (!suggestions) {
      // AI yanıt vermezse fallback
      return ['AI önerisi oluşturulamadı'];
    }

    // ============ TEXT PARSING & CLEANING ============
    // Yanıtı satırlara böl ve temizle
    return suggestions
      .split('\n') // Satırlara ayır
      .filter(line => line.trim() && (line.includes('-') || line.includes('•') || line.match(/^\d+\./))) // Sadece madde işaretli satırları al
      .map(line => line.replace(/^[-•\d.]\s*/, '').trim()) // Madde işaretlerini temizle
      .slice(0, count); // İstenen sayıda öneri al
      
  } catch (error) {
    // ============ ERROR HANDLING ============
    // OpenAI API hatalarını yakala ve logla
    console.error('OpenAI görev önerisi hatası:', error);
    
    // Kullanıcıya generic hata mesajı döndür
    return ['AI önerisi şu anda kullanılamıyor'];
  }
}

/**
 * ============================================================================
 * GÖREV AÇIKLAMASI OLUŞTURMA FONKSİYONU
 * ============================================================================
 * 
 * Verilen görev başlığına göre detaylı açıklama oluşturur.
 * Nasıl yapılacağına dair pratik ipuçları içerir.
 * 
 * @param title - Görev başlığı
 * @returns Promise<string> - Detaylı görev açıklaması
 * 
 * Örnek Kullanım:
 * generateTaskDescription("Mutfağı temizle")
 * -> "Mutfağı temizlemek için önce tüm yüzeyleri toplayın, bulaşıkları yıkayın..."
 */
export async function generateTaskDescription(title: string): Promise<string> {
  try {
    // ============ OPENAI API CALL ============
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Sen bir görev yönetimi asistanısın. Verilen görev başlığına göre kısa, net ve uygulanabilir bir görev açıklaması oluştur. 
          
          KURALLAR:
          - Açıklama 2-3 cümle olmalı
          - Nasıl yapılacağına dair pratik ipuçları içermeli
          - Türkçe yanıtla
          - Motivasyon verici ton kullan
          - Spesifik adımlar öner`
        },
        {
          role: "user",
          content: `"${title}" başlıklı görev için açıklama oluştur.`
        }
      ],
      max_tokens: 150, // Kısa açıklamalar için yeterli
      temperature: 0.6, // Daha tutarlı sonuçlar için düşük temperature
    });

    // ============ RESPONSE PROCESSING ============
    return response.choices[0]?.message?.content || 'AI açıklaması oluşturulamadı';
    
  } catch (error) {
    // ============ ERROR HANDLING ============
    console.error('OpenAI açıklama oluşturma hatası:', error);
    return 'AI açıklaması şu anda kullanılamıyor';
  }
}

/**
 * ============================================================================
 * GÖREV ÖNCELİK BELİRLEME FONKSİYONU
 * ============================================================================
 * 
 * Görev başlığı ve açıklamasına göre öncelik seviyesi analiz eder.
 * AI'nın analiz mantığını da döndürür (transparency için).
 * 
 * @param title - Görev başlığı
 * @param description - Görev açıklaması
 * @returns Promise<{priority: string, reasoning: string}> - Öncelik ve açıklama
 * 
 * Örnek Kullanım:
 * analyzeTaskPriority("Acil rapor hazırla", "Yarına kadar teslim edilmeli")
 * -> {priority: "acil", reasoning: "Son tarih çok yakın..."}
 */
export async function analyzeTaskPriority(title: string, description: string): Promise<{
  priority: 'düşük' | 'orta' | 'yüksek' | 'acil';
  reasoning: string;
}> {
  try {
    // ============ OPENAI API CALL ============
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Sen bir görev analizi uzmanısın. Verilen görev başlığı ve açıklamasına göre görevin öncelik seviyesini belirle.
          
          ÖNCELİK SEVİYELERİ:
          - "düşük": Acil değil, gelecekte yapılabilir
          - "orta": Normal zamanlama, birkaç gün içinde
          - "yüksek": Önemli, bir iki gün içinde yapılmalı  
          - "acil": Hemen yapılması gereken, kritik
          
          YANIT FORMATI (JSON):
          {"priority": "seviye", "reasoning": "açıklama"}
          
          Türkçe yanıtla ve analiz mantığını açıkla.`
        },
        {
          role: "user",
          content: `Başlık: "${title}"\nAçıklama: "${description}"\n\nBu görevin öncelik seviyesini belirle.`
        }
      ],
      max_tokens: 100, // Kısa analiz için yeterli
      temperature: 0.3, // Tutarlı analiz için düşük temperature
    });

    // ============ RESPONSE PROCESSING ============
    const result = response.choices[0]?.message?.content;
    if (!result) {
      // AI yanıt vermezse default değer
      return { priority: 'orta', reasoning: 'AI analizi yapılamadı' };
    }

    try {
      // ============ JSON PARSING ============
      // AI'nın JSON formatındaki yanıtını parse et
      const parsed = JSON.parse(result);
      return {
        priority: parsed.priority || 'orta',
        reasoning: parsed.reasoning || 'AI analizi tamamlandı'
      };
    } catch {
      // JSON parse hatası durumunda default döndür
      return { priority: 'orta', reasoning: 'AI yanıtı işlenemedi' };
    }
    
  } catch (error) {
    // ============ ERROR HANDLING ============
    console.error('OpenAI öncelik analizi hatası:', error);
    return { priority: 'orta', reasoning: 'AI analizi şu anda kullanılamıyor' };
  }
}

/**
 * ============================================================================
 * GÖREV KATEGORİSİ ÖNERME FONKSİYONU
 * ============================================================================
 * 
 * Görev içeriğine göre en uygun kategorileri önerir.
 * Önceden tanımlı kategori listesinden seçim yapar.
 * 
 * @param title - Görev başlığı
 * @param description - Görev açıklaması  
 * @returns Promise<string[]> - Önerilen kategori listesi (max 3)
 * 
 * Örnek Kullanım:
 * suggestTaskCategory("Doktor randevusu al", "Yıllık check-up için")
 * -> ["Sağlık", "Kişisel", "Randevu"]
 */
export async function suggestTaskCategory(title: string, description: string): Promise<string[]> {
  try {
    // ============ OPENAI API CALL ============
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Sen bir görev kategorilendirme uzmanısın. Verilen görev için en uygun 3 kategori öner.
          
          MEVCUT KATEGORİLER:
          İş, Kişisel, Eğitim, Sağlık, Alışveriş, Finans, Ev İşleri, Hobi, Sosyal, Teknoloji, Spor, Aile
          
          KURALLAR:
          - Sadece yukarıdaki kategorilerden seç
          - En fazla 3 kategori öner
          - En uygun olanları öncelikle sırala
          - Yanıtı virgülle ayrılmış liste olarak ver
          - Türkçe yanıtla
          
          ÖRNEK YANIT: "İş, Teknoloji, Proje"`
        },
        {
          role: "user",
          content: `Başlık: "${title}"\nAçıklama: "${description}"\n\nBu görev için kategori öner.`
        }
      ],
      max_tokens: 50, // Kısa kategori listesi için yeterli
      temperature: 0.4, // Tutarlı kategorizasyon için
    });

    // ============ RESPONSE PROCESSING ============
    const categories = response.choices[0]?.message?.content;
    if (!categories) {
      // AI yanıt vermezse fallback kategori
      return ['Genel'];
    }

    // ============ TEXT PARSING ============
    // Virgülle ayrılmış kategorileri array'e çevir
    return categories
      .split(',') // Virgüle göre ayır
      .map(cat => cat.trim()) // Boşlukları temizle
      .filter(cat => cat.length > 0) // Boş stringleri filtrele
      .slice(0, 3); // Max 3 kategori al
      
  } catch (error) {
    // ============ ERROR HANDLING ============
    console.error('OpenAI kategori önerisi hatası:', error);
    return ['Genel']; // Hata durumunda default kategori
  }
} 