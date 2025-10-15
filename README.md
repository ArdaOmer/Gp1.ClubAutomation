# 🧩 GP1 Club Automation

## 📘 Proje Tanımı
**GP1 Club Automation**, üniversite öğrenci kulüplerinin etkinliklerini, üyelik süreçlerini ve yoklama işlemlerini merkezi bir sistem üzerinden yönetmelerini sağlayan bir **web tabanlı otomasyon sistemidir**.

Proje, hem öğrenci kullanıcılarının hem de kulüp yöneticilerinin etkinlik planlama, üyelik başvurusu, duyuru paylaşımı gibi işlemleri kolayca gerçekleştirebilmeleri için tasarlanmıştır.  
Ayrıca Python tabanlı bir **yapay zekâ modülü**, öğrencilerin doldurdukları anketlere göre onlara uygun kulüpleri önerecektir.

---

## ⚙️ Teknoloji Yığını
| Katman | Teknoloji |
|--------|------------|
| **Frontend** | React (Vite + TypeScript) |
| **Backend** | ASP.NET Core (.NET 8) |
| **Veritabanı** | PostgreSQL (Docker Compose üzerinden) |
| **AI Modülü** | Python (öneri sistemi) |
| **Containerization** | Docker Desktop + WSL 2 |
| **Versiyon Kontrolü** | Git + GitHub |

---

## 🚀 Proje Kurulumu

### 🔹 1. GitHub’dan Kodları Çekme
```bash
git clone https://github.com/ArdaOmer/Gp1.ClubAutomation.git
cd Gp1.ClubAutomation
```
> 💡 `main` branch’e bu proje de doğrudan push yapılmalı.
---

### 🐳 2. Docker Desktop Kurulumu
1. [Docker Desktop](https://www.docker.com/products/docker-desktop/) kurun.
2. WSL 2 yüklü olmalı. Kontrol için:
   ```bash
   wsl --version
   ```
   Eğer eskiyse:
   ```bash
   wsl --update
   ```
3. Docker‑ı başlatın ve çalıştığından emin olun.

---

### 🐘 3. PostgreSQL Docker ile Çalıştırma
Kök dizinde bulunan `docker-compose.yml` dosyası PostgreSQL servisini ayağa kaldırır:
```bash
docker-compose up -d
```

Varsayılan bağlantı bilgileri:
```
Host: localhost
Port: 5440
User: gp1
Password: gp1pass
Database: gp1
```

> ⚠️ Eğer `5432` portu başka servis tarafından kullanılıyorsa, `5440` olarak güncellenmiştir.

---

### 💻 4. .NET 8 Kurulumu
[.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0) sürümünü indirip kurun.  
Kurulumu doğrulamak için:
```bash
dotnet --version
```

---

## ⚙️ Projeyi Ayağa Kaldırma

### 🔸 Backend (API)
```bash
cd Gp1.ClubAutomation.Api
dotnet restore
dotnet ef database update
dotnet run
```
> API varsayılan olarak: `https://localhost:5001` adresinde çalışır.

---

### 🔸 Frontend (React)
```bash
cd Gp1.ClubAutomation.Web
npm install #not: yüklü değil ise
npm run dev
```
> Uygulama: `http://localhost:5173` adresinde çalışır.

---

## 🧱 Kod Rutinleri

### 🔹 Migration Oluşturma
Yeni entity ve configuration'u eklendiğinde:
```bash
dotnet ef migrations add <MigrationName> -p Gp1.ClubAutomation.Infrastructure -s Gp1.ClubAutomation.Api
dotnet ef database update -p Gp1.ClubAutomation.Infrastructure -s Gp1.ClubAutomation.Api
```

---

### 🔹 Endpoint Oluşturma (özet)
- `Application` katmanında servis (service) oluşturulur.
- `Api` katmanında ilgili `Controller` yazılır.
- DTO ve mapping işlemleri `Application` katmanında tanımlanır.
- Swagger üzerinden endpoint testleri yapılabilir (`/swagger` route). 
- Testler için Postman'de ayrıca kullanılabilir.

---

## 🧩 Veritabanı Yapısı
- Varsayılan şema: **club**
- Ortak alanlar:  
  `CreatedDate`, `UpdatedDate`, `CreatedBy`, `UpdatedBy`, `IsActive`, `IsDeleted`
- Örnek tablolar:
    - `club.Clubs`
    - `club.Events`

---

## 👥 Yetkilendirme Yapısı
- Her kullanıcı bir **üye (User)** veya **kulüp yöneticisi (Admin)** olabilir.
- `IsAdmin` alanı kullanıcı rolünü belirler.
- Super Admin bulunmaz — yalnızca belirli kullanıcılar yönetici statüsündedir.

---

## 💡 Ek Notlar
- `BaseEntity` sınıfı tüm tabloların temel alanlarını (CreatedDate, IsActive vb.) içerir.
- PostgreSQL konteyner portu: `5440`
- `.gitignore` tüm `bin/` ve `obj/` klasörlerini hariç tutar.
-  Local bilgisayar dizileri altına değil, `C:\Projects\Gp1.ClubAutomation` gibi bir dizine klonlanması tavsiye edilir.

---

## 🧠 Katkı Rehberi

### 🔹 Ana Git Komutları
Proje doğrudan `main` branch üzerinden yönetilir.

1. Değişiklikleri commit etmeden önce güncel kodları çek:
   ```bash
   git pull
   ```

2. Yeni dosya veya değişiklikleri ekle:
   ```bash
   git add .
   ```

3. Commit mesajını yaz:
   ```bash
   git commit -m "Açıklayıcı commit mesajı"
   ```

4. Değişiklikleri `main` branch’e gönder:
   ```bash
   git push origin main
   ```

> 💡 Not: Eğer ilk kez push yapıyorsan `git push --set-upstream origin main` komutunu kullanabilirsin.

---

### 🔹 JetBrains Rider Üzerinden Git İşlemleri
1. Sol side bar'da bulunan **Commit** sekmesini aç.
4. Değişikliklerin yapıldığında gözükür. Commit mesajını yaz ve **Commit and Push** butonuna tıkla.
5. Eğer önce güncelleme yapmak istersen: `Git → Pull` menüsünden güncel kodları çekebilirsin.
6. Push sonrası değişiklikler otomatik olarak GitHub repo’suna yansır.

> 💡 Not: Eğer değişikliklerde kırmızı alanlar var ise, üstüne sağ tık->Git->Add diyoruz ve gönderiyoruz değişikliklerimizi seçip.
>  Ayrıca değişikliklerin yapıldı ama pull alman gerekiyor ve Rollback (kodları eski haline döndürmek) istemiyorsan, 'git stash push' diyoruz ve o değişiklikler saklanıyor,
>  bunun üstüne 'git stash pop' diyerek değişiklik yapılmış dosyalarımızı, mevcut değişikliklere yansıtabiliriz.

---