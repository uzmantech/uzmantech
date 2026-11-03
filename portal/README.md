# Uzmantech Web Portal

Bu klasör, Uzmantech web portalının ayrı geliştirme alanıdır. Mevcut kök web sitesi ve masaüstü uygulama dosyaları değiştirilmez.

## Dosya yapısı

- `index.html`: Ziyaretçi portalı
- `admin.html`: Yönetim paneli arayüzü
- `assets/css/site.css`: Ziyaretçi arayüz stilleri
- `assets/css/admin.css`: Yönetim paneli stilleri
- `assets/js/config.js`: Tarayıcıda kullanılabilecek herkese açık yapılandırma
- `assets/js/api.js`: Sunucu API bağlantı katmanı taslağı
- `assets/js/site.js`: Arama, filtreleme ve arayüz etkileşimleri
- `assets/js/admin.js`: Yönetim arayüzü etkileşimleri

## Şu anki durum

Bu sürüm arayüz ve dosya yapısı başlangıcıdır. Cihazlar, dosyalar, kullanıcılar ve ödemeler örnek veridir. Kimlik doğrulama, ödeme, video ve indirme uçları henüz bağlı değildir.

## Güvenlik ve entegrasyon kuralları

1. Supabase `service_role` anahtarı hiçbir zaman tarayıcıya konulmaz.
2. Yönetici yetkisi yalnızca sunucu tarafında doğrulanır.
3. Web oturumu masaüstü uygulamasının cihaz-hash kilidine dayalı giriş akışından ayrı tasarlanır.
4. Mevcut masaüstü `login`, `register` ve `archive-service` fonksiyonları incelenmeden değiştirilmez.
5. Dosya ikili içerikleri herkese açık URL ile sunulmaz. Üyelik ve dosya yetkisi sunucuda kontrol edilir; gerekiyorsa kısa ömürlü imzalı bağlantı üretilir.
6. EFT/dekont bildirimi lisansı etkinleştirmez. Yönetici dekontu doğruladıktan sonra sunucu lisansı başlatır.
7. Veritabanı tabloları ve RLS politikaları mevcut masaüstü bağımlılıkları incelenmeden değiştirilmez.

## Yayın

Mevcut GitHub Pages iş akışı depo kökünü yayınladığı için bu klasör `/portal/` yolunda sunulabilir. Bu, gerçek üyelik veya dosya servisi olduğu anlamına gelmez.

## Sonraki geliştirme aşamaları

- Mevcut Supabase Edge Function kaynaklarının ve RLS bağımlılıklarının incelenmesi
- Ayrı web oturumu ve güvenli yetkilendirme
- Üye kayıt/başvuru ve yönetici onay akışı
- Ödeme bildirimi, dekont saklama ve manuel onay
- Mevcut arşiv kataloğuna salt-okunur bağlantı ve güvenli indirme
- Eğitim içeriklerinin üyelik kontrolüyle sunulması
- Yönetici işlem kayıtları ve yetki kontrolleri
