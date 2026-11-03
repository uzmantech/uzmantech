# Uzmantech Web Portal

## Canlı bileşenler
- GitHub Pages üzerinde statik portal arayüzü
- Supabase Edge Function `portal-api` v6: web oturumu, arşiv sorgusu ve ödeme bildirimi
- Mevcut `users` tablosu üzerinden web giriş doğrulaması
- Mevcut PBKDF2_SHA256 parola formatı ile uyum
- Ayrı web oturumu; masaüstü cihaz-hash girişi değiştirilmez
- Mevcut `rapid-service` üzerinden admin kullanıcı listesi, lisans verme/uzatma ve pasifleştirme
- Ödeme dekontları `portal-receipts` özel bucket'ına sunucu üzerinden yüklenir
- Yönetici dekontları 10 dakikalık imzalı bağlantıyla görüntüler
- Yönetici onayı `portal_review_payment` işlemiyle ödeme kaydını ve lisans güncellemesini atomik uygular
- Arşiv kayıtları Supabase'den okunur; oturum açmamış ziyaretçilere dosya URL alanları gönderilmez

## Paket süreleri
- Aylık: 30 gün
- 6 aylık: 180 gün
- Yıllık: 365 gün

Paket fiyatları ve banka hesap/IBAN bilgisi henüz portala girilmedi. Üye ödeme bildirimi formunda tutarı girer ve dekontu yükler; gerçek transfer bilgisi işletme tarafından ayrıca paylaşılmalıdır.

## Henüz etkin olmayan bölümler
- Web kayıt: mevcut kayıt akışı e-posta doğrulama kodu ister. Web için doğrulama e-postası gönderen servis henüz yapılandırılmadı.
- Eğitim videoları: eğitim içerik kaynağı henüz tanımlanmadı.
- Harici arşiv dosya bağlantıları, üye oturumunda gösterilse bile sağlayıcının herkese açık linkiyse kopyalanıp paylaşılabilir. Gerçek süreli erişim için dosyaların özel depolamaya taşınması gerekir.

## Güvenlik
- Tarayıcıda yalnızca Supabase publishable key bulunur.
- `service_role` ve `ADMIN_SESSION_SECRET` Edge Function ortamında kalır.
- Ödeme tablosunda RLS açıktır; anon/authenticated rollerinin tablo erişimi yoktur. Ödeme işlemleri yalnızca sunucu tarafındaki Edge Function üzerinden yürütülür.
- Dekont bucket'ı private durumdadır. Tarayıcıya kalıcı/public dekont adresi verilmez.
- Admin işlemleri mevcut `rapid-service` fonksiyonunda tekrar yetkilendirilir.
- Masaüstü `login`, `register` ve `archive-service` fonksiyonları değiştirilmedi.
- Kök `index.html` ve mevcut masaüstü uygulaması değiştirilmedi.

## Yayın
- Portal: `/portal/`
- Yönetim: `/portal/admin.html`
- Kök `index.html` ve mevcut Pages workflow korunmuştur.
