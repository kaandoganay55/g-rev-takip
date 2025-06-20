import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

// POST metodu - Yeni kullanıcı kaydı
export async function POST(request: NextRequest) {
  try {
    // İstek gövdesinden kullanıcı verilerini al
    const { name, email, password } = await request.json();

    // Gerekli alanların kontrolü
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Tüm alanlar gereklidir' },
        { status: 400 }
      );
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Geçersiz email formatı' },
        { status: 400 }
      );
    }

    // Şifre uzunluk kontrolü
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      );
    }

    // MongoDB istemcisine bağlan
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    // Kullanıcının daha önce kayıtlı olup olmadığını kontrol et
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email ile zaten kayıtlı bir kullanıcı var' },
        { status: 409 }
      );
    }

    // Şifreyi hash'le
    const saltRounds = 12; // Güvenlik için 12 round kullan
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Yeni kullanıcı nesnesini oluştur
    const newUser = {
      name,
      email: email.toLowerCase(), // Email'i küçük harfe çevir
      password: hashedPassword,
      createdAt: new Date(),
      emailVerified: null, // NextAuth uyumluluğu için
    };

    // Kullanıcıyı veritabanına kaydet
    const result = await usersCollection.insertOne(newUser);

    // Başarılı kayıt yanıtı (şifreyi döndürme!)
    return NextResponse.json(
      {
        message: 'Kullanıcı başarıyla kaydedildi',
        user: {
          id: result.insertedId,
          name,
          email: email.toLowerCase(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Hata durumunda hata mesajı döndür
    console.error('Kullanıcı kaydı hatası:', error);
    return NextResponse.json(
      { error: 'Kullanıcı kaydedilirken hata oluştu' },
      { status: 500 }
    );
  }
} 