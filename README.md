# Katman ERP

Epoksi, endustriyel zemin ve kaplama uygulama firmalari icin cok kiracili ERP/SaaS baslangic dilimi.

## Mevcut dilim

- .NET 10 Web API + EF Core + MySQL provider
- JWT authentication; tenant kimligi yalnizca `tenant_id` claim'inden okunur
- Roller: `FounderGeneralManager` (tam yonetim), `Sales` (satis temsilcisi), `Field` (saha personeli)
- Tenant-owned entity'lerde EF Core global query filter
- Admin/Sales/Saha gibi rol claim'i ve virgulle ayrilmis granuler permission claim'leri
- Login, current user, workspace summary, tenant filtreli customer ve quote endpoint'leri
- Personel icin tenant icinde musteri ve kendisine atanmis teklif sorgusu
- Teklif onayi: alan 1000 m²'den buyukse veya USD/EUR tutari 1000 ve uzeriyse yonetim onayi zorunlu
- Admin icin `POST /api/workspace/quotes/{id}/approve` onay endpoint'i
- Responsive React + TypeScript operasyon paneli: teklif hacmi, aylik hedef, teklifler, CRM/stok navigasyonu

## MySQL kurulumu ve baglanti

Yerel makinede MySQL 8 servisi `localhost:3306` adresinde calisiyor olmali. MySQL Workbench'te yerel sunucuya yonetici hesabiyla baglanip SQL Editor'de uygulama veritabanini ve ayri bir uygulama kullanicisini olusturun:

```sql
CREATE DATABASE IF NOT EXISTS flooring_erp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'flooring_app'@'localhost'
  IDENTIFIED BY 'KENDI_GUCLU_SIFRENIZ';

GRANT ALL PRIVILEGES ON flooring_erp.* TO 'flooring_app'@'localhost';
```

`KENDI_GUCLU_SIFRENIZ` degerini kendiniz belirleyin. Uygulama icin root hesabini kullanmayin; parolayi kaynak dosyalara veya git'e eklemeyin.

## Guvenli yerel calistirma

Secret ve veritabani sifresi repoya yazilmaz. PowerShell ile API'yi baslatmadan once:

```powershell
$env:Jwt__Secret = 'en-az-32-karakterlik-gelistirme-secret-degeri'
$env:ConnectionStrings__Default = 'Server=localhost;Port=3306;Database=flooring_erp;User Id=flooring_app;Password=KENDI_GUCLU_SIFRENIZ;'
```

Ilk veritabani semasini olusturmak veya guncellemek icin yukaridaki iki ortam degiskenini ayni PowerShell penceresinde ayarlayin, sonra:

```powershell
dotnet ef database update --project .\FlooringErp.Api --startup-project .\FlooringErp.Api
```

Komut basarili olursa EF Core migration'lari MySQL'e uygulanir. Sonra ayni pencerede `dotnet run --project .\FlooringErp.Api` ile API'yi baslatin. Baglanti hatalarinda MySQL servis durumunu, `localhost:3306` portunu, veritabani/kullanici adini ve sifreyi kontrol edin.
Bekleyen migration'lar, tenant/musteri/kullanici yabanci anahtar baglantilari dahil, bu komutla uygulanir; migration SQL'lerini Workbench'te elle calistirmaniz gerekmez.

Teklif onay esikleri `appsettings.json` icindeki `QuoteApproval` bolumunden degistirilebilir. Tenant kimligi request body veya header'dan alinmaz; JWT'de `tenant_id` claim'inden gelir.

Frontend:

```powershell
cd .\web
npm install
npm run dev
```

MySQL/API henüz hazır değilse login ekranındaki **Demo patron önizlemesi** düğmesiyle arayüzü açabilirsiniz. Bu geliştirme önizlemesi sadece tarayıcı `localStorage` verisini kullanır, gerçek kimlik doğrulaması veya güvenlik sağlamaz ve production build'de gösterilmez. Gerçek giriş için API ve seed edilmiş kurucu hesabı gerekir.

Frontend varsayılan olarak `http://localhost:5220` adresindeki HTTP API'ye bağlanır. Farklı bir API adresi kullanıyorsanız Vite'ı başlatmadan önce `$env:VITE_API_URL = 'https://localhost:7239'` gibi bir değer ayarlayın.

## Yerel test hesaplarini olusturma

MySQL calisir durumdayken API'yi gelistirme hesaplariyla baslatmak icin ayni PowerShell oturumunda:

```powershell
$env:Hutec__SeedDevelopmentData = 'true'
$env:Hutec__SeedAdminPassword = 'HutecAdmin-2026!'
$env:Hutec__SeedSalesPassword = 'HutecSales-2026!'
$env:Hutec__SeedFieldPassword = 'HutecField-2026!'
dotnet ef database update --project .\FlooringErp.Api --startup-project .\FlooringErp.Api
dotnet run --project .\FlooringErp.Api
```

Login ekranında kullanılacak test hesapları:

| Rol | Çalışma alanı | E-posta |
|---|---|---|
| Kurucu / Genel Müdür | `artemis-proje` | `admin@artemisproje.com` |
| Satış temsilcisi | `artemis-proje` | `satis@artemisproje.com` |
| Saha personeli | `artemis-proje` | `saha@artemisproje.com` |

Şifreler yalnızca environment variable'dan alınır ve kodda tutulmaz. Seed işlemi mevcut kullanıcıları tekrar oluşturmaz.
Kurucu girişi için çalışma alanı `artemis-proje`, e-posta `admin@artemisproje.com` ve şifre `Hutec__SeedAdminPassword` değişkenine verdiğiniz değerdir. Uygulama geliştirme modunda da giriş olmadan açılmaz.

API veritabani erisimi yoksa login veya korumali endpoint gercek hata ile doner; frontend sahte oturum uretmez.

## Endpoint ozeti

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/workspace/summary`
- `GET /api/workspace/customers`
- `POST /api/workspace/customers`
- `GET /api/workspace/quotes`
- `POST /api/workspace/quotes`
- `POST /api/workspace/quotes/{id}/approve`
- `POST /api/workspace/easy-quote`
- `GET /api/management/roles`
- `GET /api/management/roles/{code}`
- `POST /api/management/roles`
- `PUT /api/management/roles/{code}/permissions`
- `GET /api/management/users`
- `PUT /api/management/users/{id}/role`
- `PUT /api/management/users/{id}/approval-limits`

Rol ve personel yönetimi endpoint'leri `users.manage` izni gerektirir. Kurucu rolü değiştirilemez ve başka personele atanamaz. Rol veya izin değişiklikleri yeni girişte JWT'ye yansır. PDF teklif çıktısı, parola sıfırlama/MFA, kullanıcı daveti, gerçek zamanlı kur servisi, stok hareket geçmişi ve audit log sonraki modül adaylarıdır.
