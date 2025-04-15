
# Discord Email Verifier

> 🇺🇸 English | 🇹🇷 Türkçe 

**Discord Email Verifier** is a custom email verification bot designed for Discord servers. It ensures that users verify their email address before gaining access.  
**Discord Email Verifier**, Discord sunucuları için özel olarak geliştirilmiş bir e-posta doğrulama botudur. Kullanıcıların sunucuya erişmeden önce e-posta adreslerini doğrulamasını sağlar.

---

## ✨ Features / Özellikler

- ✅ Email verification for Discord users / Discord kullanıcıları için e-posta doğrulama
- 💾 MySQL database support / MySQL veritabanı desteği
- ⚙️ Configurable via `.env` file / `.env` dosyası ile özelleştirilebilir
- 📧 Sends verification codes via email / Doğrulama kodlarını e-posta ile gönderir
- ⏱ Rate limits email requests / Kod gönderimlerini sınırlandırma

---

## 🛠 Technologies Used / Kullanılan Teknolojiler

- [Node.js](https://nodejs.org/)
- [discord.js v14](https://discord.js.org/)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [mysql2](https://www.npmjs.com/package/mysql2)
- [nodemailer](https://www.npmjs.com/package/nodemailer)

---

## 🚀 Installation & Setup / Kurulum ve Ayarlar

### 1. Clone the Repository / Depoyu klonlayın
```bash
git clone https://github.com/yourusername/discord-email-verifier.git
cd discord-email-verifier 
```

##  2. Install Dependencies / Gerekli Bağımlılıkları Yükleyin
```bash
npm install
```

## Create .env file / .env Dosyası Oluşturun
```EMAIL_USER=
EMAIL_PASS=
SMTP_HOST=
SMTP_PORT=
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=
```
## Start Bot / Botu Başlatın
```bash
node index.js
```
