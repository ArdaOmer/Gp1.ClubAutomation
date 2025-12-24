🧩 GP1 Club Automation
======================

📘 Proje Tanımı
---------------

**GP1 Club Automation**, üniversite öğrenci kulüplerinin **üyelik yönetimi**, **etkinlik planlama**, **duyuru paylaşımı** ve **yoklama/katılım takibi** süreçlerini tek bir web platformu üzerinden yönetmesini sağlayan **web tabanlı otomasyon sistemidir**.

Sistem iki ana kullanıcı profili etrafında şekillenir:

-   **Öğrenci (User)**

    -   Kulüpleri görüntüleyebilir

    -   Üyelik durumunu görebilir

    -   Kendi kulüplerinin duyurularını takip edebilir

    -   Yaklaşan etkinlikleri görebilir, takvime ekleyebilir

    -   Etkinliklere "Attend/Cancel" ile katılım durumunu yönetebilir

    -   Profil bilgilerini güncelleyebilir (avatar dahil)

-   **Kulüp Yöneticisi / Başkan (President)**

    -   Yukarıdaki tüm yetkilere ek olarak:

    -   Kendi kulübü adına **duyuru yayınlayabilir**

    -   Duyuruları **edit/delete** edebilir

    -   Etkinlik oluşturma ekranına hızlı aksiyonla erişebilir

Ayrıca projede yer alan **Python tabanlı AI (Yapay Zekâ) modülü**, öğrencinin seçtiği ilgi alanlarına göre kulüpleri skorlayıp **öneri listesi** üretir.\
Bu modül; kulüp **isim + açıklama** metinlerini normalize eder, **ağırlıklı anahtar kelime eşleşmesi** ile skor üretir ve backend üzerinden FE'ye öneri listesi olarak döner.

* * * * *

⚙️ Teknoloji Yığını
-------------------

| Katman | Teknoloji |
| --- | --- |
| **Frontend** | React (Vite + TypeScript) |
| **Backend** | ASP.NET Core (.NET 8) |
| **Veritabanı** | PostgreSQL (Docker Compose üzerinden) |
| **ORM** | Entity Framework Core |
| **AI Modülü** | Python (FastAPI + Uvicorn) |
| **HTTP Client** | IHttpClientFactory (AI servis çağrıları için) |
| **State & Data Fetching** | @tanstack/react-query |
| **Auth / State** | Custom AuthContext + LocalStorage sync |
| **Containerization** | Docker Desktop + WSL 2 |
| **Versiyon Kontrolü** | Git + GitHub |
| **Geliştirme Araçları** | JetBrains Rider, VS Code, DataGrip/pgAdmin |

* * * * *

🚀 Proje Kurulumu
-----------------

### 🔹 1. GitHub'dan Kodları Çekme

`git clone https://github.com/ArdaOmer/Gp1.ClubAutomation.git
cd Gp1.ClubAutomation`

> 💡 Proje doğrudan `main` branch üzerinden yönetilmektedir.\
> Takım içinde ayrı branch stratejisi uygulanmadıysa doğrudan `main` üzerine push akışı kullanılabilir.

* * * * *

### 🐳 2. Docker Desktop Kurulumu

1.  [Docker Desktop](https://www.docker.com/products/docker-desktop/) kurun.

2.  WSL 2 yüklü olmalı. Kontrol:

    `wsl --version`

    Eğer eskiyse:

    `wsl --update`

3.  Docker'ı başlatın ve çalıştığını doğrulayın.

**Kontrol önerileri:**

-   Docker Desktop "Running" durumda olmalı

-   Windows'ta Hyper-V/WSL uyumluluğu açık olmalı

-   Port çakışması varsa docker-compose portu güncellenebilir

* * * * *

### 🐘 3. PostgreSQL Docker ile Çalıştırma

Kök dizindeki `docker-compose.yml`, PostgreSQL servisini ayağa kaldırır:

`docker-compose up -d`

**Varsayılan bağlantı bilgileri**

`Host: localhost
Port: 5440
User: gp1
Password: gp1pass
Database: gp1`

> ⚠️ Eğer `5432` portu başka servis tarafından kullanılıyorsa, proje portu `5440` olarak ayarlanmıştır.

**Doğrulama:**

-   `docker ps` ile container'ı görebilirsiniz

-   DataGrip/pgAdmin üzerinden yukarıdaki bilgilerle bağlanabilirsiniz

* * * * *

### 💻 4. .NET 8 Kurulumu

[.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0) sürümünü indirip kurun.

Doğrulama:

`dotnet --version`

* * * * *

⚙️ Projeyi Ayağa Kaldırma
-------------------------

### 🔸 Backend (API)

`cd Gp1.ClubAutomation.Api
dotnet restore
dotnet ef database update
dotnet run`

-   API varsayılan: `https://localhost:5001`

-   Swagger: `https://localhost:5001/swagger`

> ℹ️ `dotnet ef database update` komutu migration'ları çalıştırıp şemayı oluşturur.

**Sık karşılaşılan durumlar:**

-   DB bağlantı hatası → Docker/Postgres çalışıyor mu kontrol edin

-   Port hatası → 5440 açık mı kontrol edin

-   Migration hatası → `dotnet ef migrations list` ile kontrol edilebilir

* * * * *

### 🔸 Frontend (React)

`cd Gp1.ClubAutomation.Web
npm install
npm run dev`

-   UI: `http://localhost:5173`

**Notlar:**

-   `npm install` ilk kurulumda zorunludur

-   Node/NPM sürümü çok eskiyse Vite sorun çıkarabilir

* * * * *

🧠 AI Modülü (Python -- FastAPI)
-------------------------------

Bu proje `Gp1.ClubAutomation.AI` klasörü altında çalışır ve backend tarafından HTTP ile çağrılır.

### ✅ AI Servisini Çalıştırma (Standart)

`cd .\Gp1.ClubAutomation.AI
python -m uvicorn app:app --host 127.0.0.1 --port 9000 --reload`

> AI: `http://127.0.0.1:9000`

* * * * *

### 🧹 AI Ortamını Sıfırlama (Remove-Item yöntemi) ✅ Önerilen

Bu yöntem herkes için birebir aynı çalışır (Python yolu kişiden kişiye değişse bile).

- `cd .\Gp1.ClubAutomation.AI`
- `Remove-Item -Recurse -Force .venv`
- `python -m venv .venv`
- `.\.venv\Scripts\Activate.ps1`
- `pip install --upgrade pip`
- `pip install -r requirements_to_ai.txt`
- `python -m uvicorn app:app --host 127.0.0.1 --port 9000 --reload`

**Neden bu yöntem?**

-   `.env` bağımlılığı olmadan herkes aynı kurulumla çalıştırabilir

-   Bozulmuş/çakışan paketleri sıfırlar

-   "works on my machine" problemlerini ciddi azaltır

* * * * *

### 🔁 Backend ↔ AI İletişimi

-   FE: `api.ts` üzerinden `POST /api/ai/recommend`

-   Backend: `AiController.cs`

    -   DB'den kulüpleri çeker (`_db.Clubs`)

    -   AI servis endpoint'ine `interests + clubs` gönderir

    -   AI skorlarını alır

    -   Skora göre sıralayıp FE'ye `recommendedClubs` döner

-   AI (FastAPI):

    -   `/recommend-clubs`

    -   `interests` doğrular (pinned list)

    -   `clubs` listesini skorlar

    -   `scores: [{clubId, score}]` döner

* * * * *

🧪 Test Verisi
--------------

Repo'ya eklenen:

-   `sql-test-datas-insert.rar`

içinde test amaçlı **INSERT query**'leri bulunur.

### Kullanım Önerisi

1.  DB migration çalıştır:

`dotnet ef database update`

1.  DataGrip / pgAdmin ile DB'ye bağlan

2.  `.rar` içindeki SQL scriptlerini çalıştır

> ✅ Test data olmadan sistem çalışır ama:
>
> -   Home ekranı boş görünebilir
>
>
> -   Announcements listesi boş olur
>
>
> -   AI önerileri anlamsız/boş olabilir
>
>
> -   Attendance count gibi sayılar 0 görünür

* * * * *

🧱 Kod Rutinleri
----------------

### 🔹 Migration Oluşturma

Yeni entity / configuration eklendiğinde:

`dotnet ef migrations add <MigrationName> -p Gp1.ClubAutomation.Infrastructure -s Gp1.ClubAutomation.Api
dotnet ef database update -p Gp1.ClubAutomation.Infrastructure -s Gp1.ClubAutomation.Api`

**Açıklama:**

-   `-p` migration'ın yazılacağı projeyi belirtir (Infrastructure)

-   `-s` startup project'i belirtir (API)

* * * * *

### 🔹 Endpoint Oluşturma (özet)

Genel akış:

1.  **Domain**: Entity/ValueObject tanımlanır (gerekliyse)

2.  **Application**:

    -   DTO tanımlanır

    -   Service/Interface yazılır

    -   Mapping/Validation yapılır

3.  **Infrastructure**:

    -   Repository/DbContext işlemleri

    -   EF konfigurasyonları

4.  **API**:

    -   Controller endpoint tanımlanır

    -   Request/Response dönüşleri yapılır

**Test:**

-   Swagger (`/swagger`)

-   Postman

* * * * *

🧩 Veritabanı Yapısı
--------------------

-   Varsayılan şema: **club**

-   Ortak alanlar:

    -   `CreatedDate`, `UpdatedDate`, `CreatedBy`, `UpdatedBy`, `IsActive`, `IsDeleted`

Örnek tablolar:

-   `club.Clubs`

-   `club.Events`

-   `club.Memberships`

-   `club.Announcements`

-   `club.Attendances`

-   `club.Users` (veya projedeki isimlendirmeye göre)

> ℹ️ Projede "soft delete" mantığı bulunduğu için `IsDeleted=true` olan kayıtlar normal sorgularda görünmez.

* * * * *

👥 Yetkilendirme Yapısı
-----------------------

-   Her kullanıcı "User" olarak giriş yapar

-   Kulüp içindeki rol, `Membership` üzerinden belirlenir:

    -   `President` → duyuru yönetim hakkı

-   Super Admin yoktur

* * * * *

💡 Ek Notlar
------------

### 🔹 React Query (Stabil Query Key)

Projede bazı endpoint'ler (ör. announcements/memberships) **clubId listesine bağlı** olduğu için query key'lerin **stabil** olması önemlidir.

-   `myClubIdsArr.join(",")` gibi sabit string key üretmek performans ve doğru cache için önemlidir.

-   ClubId listesinin her render'da farklı referans üretmesi durumunda sürekli refetch olabilir.

### 🔹 Profile Sayfası (Me Hydration)

Profile sayfasında:

-   `getMe()` ile server'dan güncel profil çekilir

-   `updateUser(updated)` ile AuthContext + localStorage senkronize edilir

-   "dirty" state ile kullanıcı edit yaparken server refresh'in form alanlarını ezmesi engellenir

* * * * *

🧠 Katkı Rehberi
----------------

### 🔹 Ana Git Komutları

Proje doğrudan `main` branch üzerinden yönetilir.

1.  Güncel kodları çek:

    `git pull`

2.  Değişiklikleri ekle:

    `git add .`

3.  Commit:

    `git commit -m "Açıklayıcı commit mesajı"`

4.  Push:

    `git push origin main`

* * * * *

### 🔹 JetBrains Rider Üzerinden Git İşlemleri

1.  **Commit** sekmesini aç

2.  Değişiklikleri kontrol et

3.  Commit mesajı yaz

4.  **Commit and Push**

Ek not:

-   Değişiklik yaptın ama pull alman gerekiyorsa ve rollback istemiyorsan:

    - `git stash push`
    - `git pull`
    - `git stash pop`

* * * * *

✅ Proje Durumu
--------------

**✔ Proje tamamlandı.**\
Repo, local ortamda DB + API + FE + AI çalışacak şekilde tasarlanmıştır.