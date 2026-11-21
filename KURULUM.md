# Element Arenası — Masaüstü uygulaması ve Google girişi kurulumu

Bu işlemler bir kerelik. Bittiğinde oyun:
- Masaüstünden açılan bir Windows uygulaması olur.
- Açılışta "Google ile giriş yap" ya da "Misafir olarak oyna" sorar. Misafirde çok oyunculu kapalıdır.
- Claude'da yaptığımız her güncelleme, uygulamayı bir sonraki açışında kendiliğinden gelir.

## 1. GitHub (oyunun ve exe'nin evi)
1. github.com'da ücretsiz hesap aç.
2. Sağ üstte **+** → **New repository** → adı: `element-arenasi` → **Public** seç → **Create repository**.
3. claude.ai → **Ayarlar → Connectors** → **GitHub**'ı bağla. (Bundan sonra dosyaları ben gönderirim.)
4. Depoda **Settings → Pages** → "Source" kısmında **GitHub Actions** seç.

## 2. Supabase (giriş ve çok oyunculu sunucusu)
1. supabase.com → ücretsiz hesap → **New project** (Bölge: Central EU / Frankfurt). Şifreyi bir yere not et.
2. Sol menü **SQL Editor** → `supabase-kurulum.sql` dosyasının içini yapıştır → `SAHIP@gmail.com` yazan 4 yeri kendi Gmail adresinle değiştir → **Run**.
3. **Project Settings → API**: "Project URL" ve "anon public" anahtarını kopyala (bana göndereceksin).

## 3. Google girişi
1. console.cloud.google.com → yeni proje oluştur ("Element Arenasi").
2. **APIs & Services → OAuth consent screen** → External → uygulama adı ve e-postanı yaz → kaydet → **Publish app**.
3. **Credentials → Create credentials → OAuth client ID** → türü **Web application**.
4. "Authorized redirect URIs" kısmına Supabase'deki adresi ekle:
   Supabase → **Authentication → Providers → Google** sayfasında yazan "Callback URL" (https://…supabase.co/auth/v1/callback).
5. Google'ın verdiği **Client ID** ve **Client Secret**'ı Supabase'deki o Google sayfasına yapıştır → **Enable** → kaydet.
6. Supabase → **Authentication → URL Configuration**:
   - Site URL: `https://KULLANICIADIN.github.io/element-arenasi/`
   - Redirect URLs'e ekle: `elementarenasi://auth` ve `https://KULLANICIADIN.github.io/element-arenasi/**`

## 4. Bana gönder
- GitHub kullanıcı adın
- Supabase Project URL ve anon public anahtarı (gizli değildir, oyunun içinde durur)
- Hazır modelleri yönetecek Gmail adresin

Ben ayarları doldurup GitHub'a gönderirim. GitHub birkaç dakikada:
- oyunu `https://KULLANICIADIN.github.io/element-arenasi/` adresinde yayınlar,
- **Releases** bölümüne `ElementArenasi-Kurulum.exe` koyar.

## 5. Kur
Releases'ten exe'yi indir, çift tıkla. Windows "bilinmeyen yayıncı" uyarısı verirse **Daha fazla bilgi → Yine de çalıştır**. Masaüstünde **Element Arenası** simgesi oluşur.

## Not
- Supabase'in ücretsiz projeleri bir hafta hiç kullanılmazsa uykuya geçer; Supabase panelinden tek tıkla uyandırılır.
- Tam ekran: F11.
