# Uzmantech Web Portal

## Canlı bileşenler
- GitHub Pages üzerinde statik portal arayüzü
- Supabase Edge Function `portal-api`: web oturumu ve arşiv sorgusu
- Mevcut `users` tablosu üzerinden web giriş doğrulaması
- Mevcut PBKDF2_SHA256 parola formatı ile uyum
- Ayrı web oturumu; masaüstü cihaz-hash girişi değiştirilmez
- Mevcut `rapid-service` üzerinden admin kullanıcı listesi, dashboard, lisans verme/uzatma ve pasifleştirme
- Arşiv kayıtları Supabase'den okunur; oturum açmamış ziyaretçilere dosya URL alanları gönderilmez

## Bilinçli olarak henüz açılmayanlar
- Web kayıt: mevcut kayıt akışı e-posta doğrulama kodu ister. Web için doğrulama e-postası gönderen servis henüz yapılandırılmadı.
- Ödeme/dekont: güvenli ödeme bildirimi tablosu ve özel dekont depolama alanı henüz oluşturulmadı.
- Eğitim videoları: eğitim içerik kaynağı henüz tanımlanmadı.
- Harici dosya bağlantıları, üye oturumunda gösterilse bile sağlayıcının herkese açık linkiyse kopyalanıp paylaşılabilir. Gerçek süreli erişim için özel dosya depolama ve imzalı URL gerekir.

## Güvenlik
- Tarayıcıda yalnızca Supabase publishable key bulunur.
- `service_role` ve `ADMIN_SESSION_SECRET` Edge Function ortamında kalır.
- Admin işlemleri mevcut `rapid-service` fonksiyonunda tekrar yetkilendirilir.
- Masaüstü `login`, `register` ve `archive-service` fonksiyonları değiştirilmedi.
- Veritabanı şeması ve RLS politikaları değiştirilmedi.

## Yayın
- Portal: `/portal/`
- Yönetim: `/portal/admin.html`
- Kök `index.html` ve mevcut Pages workflow korunmuştur.
