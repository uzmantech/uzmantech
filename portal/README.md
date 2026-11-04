# Uzmantech Web Portal

## Canlı bileşenler
- Cloudflare Pages üzerinde, GitHub deposundaki `portal/` dizininden otomatik dağıtılan statik portal arayüzü
- Supabase Edge Function `portal-api` v17: web oturumu, arşiv sorgusu, ödeme bildirimi ve destek talepleri
- Mevcut `users` tablosu üzerinden web giriş doğrulaması
- Mevcut PBKDF2_SHA256 parola formatı ile uyum
- Ayrı web oturumu; masaüstü cihaz-hash girişi değiştirilmez
- Mevcut `rapid-service` üzerinden admin kullanıcı listesi, lisans verme/uzatma ve pasifleştirme
- Ödeme dekontları `portal-receipts` özel bucket'ına sunucu üzerinden yüklenir
- Yönetici dekontları 10 dakikalık imzalı bağlantıyla görüntüler
- Yönetici onayı `portal_review_payment` işlemiyle ödeme kaydını ve lisans güncellemesini atomik uygular
- Arşiv kayıtları Supabase'den okunur; oturum açmamış ziyaretçilere dosya URL alanları gönderilmez
- Üyelik kaydında 6 haneli e-posta doğrulama kodu, 10 dakika geçerlilik ve en fazla 5 hatalı deneme uygulanır
- Şifremi unuttum akışında aynı şekilde tek kullanımlık 6 haneli kodla parola yenileme yapılır
- Portal OTP e-postaları `portal_email_outbox` kuyruğuna alınır; Uzmantech masaüstü uygulaması yönetici oturumu açıkken mevcut Gmail gönderim sistemiyle sırayı işler. Uygulama kapalıysa e-postalar gönderilmez ve kodun süresi dolabilir.
- Üyeler destek talebi oluşturabilir ve kendi taleplerinin durumunu portalda takip edebilir
- Yönetim panelinde destek kuyruğu, durum güncelleme ve üyeye gösterilen yönetici notu bulunur. Destek yanıtları e-posta ile gönderilmez; portal içindeki destek geçmişinde görüntülenir.
- Destek talepleri `portal_support_tickets` tablosunda saklanır; RLS etkin ve doğrudan anon/authenticated erişimi kapalıdır
- İndirme kartı GitHub Releases üzerindeki Uzmantech v1.1.8 EXE dosyasına bağlıdır

## Paket süreleri
- Aylık: 30 gün
- 6 aylık: 180 gün
- Yıllık: 365 gün

Portalda 1, 6 ve 12 aylık paket fiyatları ile havale bilgileri gösterilir. Ödeme tutarı gönderim sırasında sunucuda güncel Enpara USD satış kuruyla yeniden doğrulanır.

## Henüz etkin olmayan bölümler
- Eğitim videoları: eğitim içerik kaynağı henüz tanımlanmadı.
- Harici arşiv dosya bağlantıları, üye oturumunda gösterilse bile sağlayıcının herkese açık linkiyse kopyalanıp paylaşılabilir. Gerçek süreli erişim için dosyaların özel depolamaya taşınması gerekir.

## Güvenlik
- Tarayıcıda yalnızca Supabase publishable key bulunur.
- `service_role` ve `ADMIN_SESSION_SECRET` Edge Function ortamında kalır.
- Ödeme tablosunda RLS açıktır; anon/authenticated rollerinin tablo erişimi yoktur. Ödeme işlemleri yalnızca sunucu tarafındaki Edge Function üzerinden yürütülür.
- `portal_email_outbox` RLS ile korunur; doğrudan anon/authenticated erişimi yoktur. OTP hash'leri doğrulama tablolarında saklanır; gönderim kuyruğundaki e-posta gövdesi gönderimden sonra temizlenir.
- Dekont bucket'ı private durumdadır. Tarayıcıya kalıcı/public dekont adresi verilmez.
- Admin işlemleri mevcut `rapid-service` fonksiyonunda tekrar yetkilendirilir.
- Masaüstü `login`, `register` ve `archive-service` fonksiyonları değiştirilmedi.
- Kök `index.html` ve mevcut masaüstü uygulaması değiştirilmedi.

## Yayın
- Portal: `/portal/`
- Yönetim: `/portal/admin.html`
- Kök `index.html` ve mevcut Pages workflow korunmuştur.
