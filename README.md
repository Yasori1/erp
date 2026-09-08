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

## Guvenli yerel calistirma

Secret ve veritabani sifresi repoya yazilmaz. PowerShell ile API'yi baslatmadan once:

```powershell
$env:Jwt__Secret = 'en-az-32-karakterlik-gelistirme-secret-degeri'
$env:ConnectionStrings__Default = 'Server=localhost;Port=3306;Database=flooring_erp;User=root;Password=MYSQL_SIFRENIZ;'
dotnet run --project .\FlooringErp.Api
```

Ilk veritabani semasini olusturmak veya guncellemek icin:

```powershell
dotnet ef database update --project .\FlooringErp.Api --startup-project .\FlooringErp.Api
```

Teklif onay esikleri `appsettings.json` icindeki `QuoteApproval` bolumunden degistirilebilir. Tenant kimligi request body veya header'dan alinmaz; JWT claim'inden gelir.

Frontend:

```powershell
cd .\web
npm install
npm run dev
```

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
- `PUT /api/management/roles/{code}/permissions`
- `PUT /api/management/users/{id}/approval-limits`

Veritabani semasi icin sonraki adim EF migration ve seed akisini eklemektir. PDF template editor, kur servisi, stok hareketleri, teklif kilidi/approval workflow ve platform-owner paneli domain katmanina ayrilacak moduller olarak planlanmistir.
