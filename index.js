require('dotenv').config();
console.log('Bot token:', process.env.BOT_TOKEN); // Token'ı kontrol et

const emailPattern = /^[0-9]+@(ogr\.edu\.tr|ogr\.edu\.tr)$/;
const { 
  Client, GatewayIntentBits, Partials, 
  ButtonBuilder, ButtonStyle, ActionRowBuilder, 
  ModalBuilder, TextInputBuilder, TextInputStyle,
  MessageFlags
} = require('discord.js');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

client.once('ready', async () => {
  console.log(`Bot ${client.user.tag} olarak giriş yaptı!`);

  const channelId = 'CHANNELID';  // Kanal ID'nizi buraya girin
  const channel = await client.channels.fetch(channelId);

  // Eski bot mesajlarını silme
  const messages = await channel.messages.fetch();
  const botMessages = messages.filter(msg => msg.author.id === client.user.id);
  await Promise.all(botMessages.map(msg => msg.delete()));

  // Doğrulama butonunu oluşturma
  const verifyButton = new ButtonBuilder()
    .setCustomId('verify_student')
    .setLabel('Doğrulamayı Başlat & Devam Et')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(verifyButton);

  // Doğrulama mesajını gönderme ve sabitleme
  const message = await channel.send({
    content: 'Doğrulamayı başlatmak için aşağıdaki butona basınız, bu sadece iki üniversiteden olan kişileri tespit etmek için yapılmış bir bottur.',
    components: [row]
  });
  
  try {
    await message.pin();
    console.log('Doğrulama mesajı sabitlendi.');
  } catch (error) {
    console.error('Mesaj sabitlenirken hata oluştu:', error);
  }
});

// 30 saniyede bir cache tablosunu kontrol et ve 5 dakikayı geçen verileri sil
setInterval(() => {
  const query = 'DELETE FROM cache WHERE created_at < NOW() - INTERVAL 5 MINUTE';
  db.execute(query, (err, results) => {
    if (err) {
      console.error('Veritabanı temizleme hatası:', err);
    } else {
      if (results.affectedRows > 0) {
        console.log('5 dakikayı geçen cache verileri silindi.');
      }
      // Eğer etkilenen satır sayısı 0 ise hiçbir şey yapma
    }
  });
}, 30000); // 30 saniyede bir çalışacak


const checkExistingCode = (discordId, interaction) => {
  const query = `SELECT verification_code FROM cache WHERE discord_id = ?`;
  db.execute(query, [discordId], async (err, results) => {
    if (err) {
      console.error('Veritabanı sorgusunda hata oluştu:', err);
      return;
    }

    if (results.length > 0) {
      // Eğer veritabanında kod varsa
      const existingCode = results[0].verification_code;

      // Kullanıcıya modal gönderme
      const modal = new ModalBuilder()
        .setCustomId('verificationCodeModal')
        .setTitle('Doğrulama Kodu Girişi');

      const codeInput = new TextInputBuilder()
        .setCustomId('codeInput')
        .setLabel('Doğrulama Kodunuzu Girin')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Doğrulama kodunuzu buraya girin')
        .setRequired(true);

      const actionRow = new ActionRowBuilder().addComponents(codeInput);
      modal.addComponents(actionRow);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.showModal(modal);
      }
      
    } else {
      // Veritabanında kod yoksa, yeni doğrulama kodu gönder
      const modal = new ModalBuilder()
        .setCustomId('emailModal')
        .setTitle('Email Doğrulama');

      const emailInput = new TextInputBuilder()
        .setCustomId('emailInput')
        .setLabel("Üniversite E-posta Adresinizi Girin")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('ogrencino@ogr.edu.tr')
        .setRequired(true);

      const actionRow = new ActionRowBuilder().addComponents(emailInput);
      modal.addComponents(actionRow);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.showModal(modal);
      }
    }
  });
};

// Interaction eventinde buton tıklama kontrolü
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId === 'verify_student') {
      const discordId = interaction.user.id;

      // Veritabanında öğrenci olup olmadığını kontrol et
      db.query('SELECT * FROM ogrenci WHERE discord_id = ?', [discordId], async (err, results) => {
        if (err) {
          console.error('Veritabanı hatası: ', err);
          return;
        }

        // Eğer kullanıcı zaten veritabanında varsa, farklı roller atanacak
        if (results.length > 0) {
          const uni = results[0].uni;  // Veritabanından 'uni' değerini alıyoruz

          let roleId;
          if (uni === '0') {
            roleId = 'ROLE ID';  // 'uni' değeri 0 ise atanacak rol ID'si
          } else if (uni === '1') {
            roleId = 'ROLE ID';  // 'uni' değeri 1 ise atanacak rol ID'si
          }

          const memberRoles = interaction.member.roles.cache;
          if (memberRoles.has(roleId)) {
            return;
          }

          // Kullanıcıya rol atama
          const role = interaction.guild.roles.cache.get(roleId);
          if (role) {
            await interaction.member.roles.add(role);  // Rolü kullanıcıya ekliyoruz
            if (!interaction.replied) {
              await interaction.reply({
                content: `Zaten kayıtlısınız, rolünüz başarıyla verildi.`,
                flags: MessageFlags.Ephemeral
              });
            }
          }

        } else {
          await checkExistingCode(interaction.user.id, interaction);
        }
      });
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'emailModal') {
      const email = interaction.fields.getTextInputValue('emailInput');
      if (!emailPattern.test(email)) {
        if (!interaction.replied) {
          await interaction.reply({ 
            content: 'Lütfen geçerli bir üniversite e-posta adresi giriniz (sadece rakamlar içermelidir ve yalnızca @ogr.edu.tr veya @ogr.edu.tr).', 
            flags: MessageFlags.Ephemeral 
          });
        }
        return;
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Discord Topluluk Doğrulama Kodu',
        text: `Topluluk sunucusu için doğrulama kodunuz: ${verificationCode} bu kod kendini 5 dakika içinde imha edecektir.`
      };

      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.error('E-posta gönderilirken hata oluştu:', error);
          if (!interaction.replied) {
            await interaction.reply({ 
              content: 'E-posta gönderilirken bir hata oluştu. Lütfen tekrar deneyiniz.', 
              flags: MessageFlags.Ephemeral 
            });
          }
        } else {
          console.log('E-posta gönderildi: ' + info.response);
          if (!interaction.replied) {
            await interaction.reply({ 
              content: 'Doğrulama kodunuz e-posta adresinize gönderildi (SPAM kutusunu kontrol etmeyi unutmayın). Lütfen kodu kontrol ediniz ardından doğrulamayı devam ettir butonuna basın.', 
              flags: MessageFlags.Ephemeral 
            });
          }

          if (email.endsWith('ogr.edu.tr')) {
            insertCodeIntoDatabase(interaction.user.id, email, verificationCode, 1);  // ogr.edu.tr için 1
          } else if (email.endsWith('ogr.edu.tr')) {
            insertCodeIntoDatabase(interaction.user.id, email, verificationCode, 0);  // ogr.edu.tr için 0
          }
        }
      });
    }

    if (interaction.customId === 'verificationCodeModal') {
      const inputCode = interaction.fields.getTextInputValue('codeInput');
      
      // Kullanıcının girdiği kodu veritabanındaki kodla karşılaştır
      const query = `SELECT verification_code, email, domain_type FROM cache WHERE discord_id = ?`;
      db.execute(query, [interaction.user.id], async (err, results) => {
        if (err) {
          console.error('Veritabanı sorgusunda hata oluştu:', err);
          return;
        }

        if (results.length > 0) {
          const storedCode = results[0].verification_code;
          const email = results[0].email;
          const domainType = results[0].domain_type;

          if (inputCode === storedCode) {
            let verifiedRole;
            if (domainType === '1') {
              verifiedRole = interaction.guild.roles.cache.get('ROLEID'); // ogr.edu.tr için rol
            } else if (domainType === '0') {
              verifiedRole = interaction.guild.roles.cache.get('ROLEID'); // ogr.edu.tr için rol
            }

            if (verifiedRole) {
              try {
                // Eğer rol bulunduysa, rolü kullanıcıya ekleyin
                await interaction.member.roles.add(verifiedRole);
                console.log(`Rol başarıyla eklendi.`);
              } catch (error) {
                console.error('Rol eklenirken hata oluştu:', error);
              }
            } else {
              console.error('Rol bulunamadı.');
            }

            const query = `
              INSERT INTO ogrenci (discord_id, email, uni)
              VALUES (?, ?, ?)
            `;
            db.execute(query, [interaction.user.id, email, domainType], (err, results) => {
              if (err) {
                console.error('Veritabanına kullanıcı bilgileri eklenirken hata oluştu:', err);
              } else {
                console.log('Kullanıcı doğrulama bilgileri veritabanına eklendi:', results);
              }
            });

            if (!interaction.replied) {
              await interaction.reply({ content: 'Kod doğru doğrulamanız tamamlandı!', flags: MessageFlags.Ephemeral });
            }

            const deleteQuery = `DELETE FROM cache WHERE discord_id = ?`;
            db.execute(deleteQuery, [interaction.user.id], (err, results) => {
              if (err) {
                console.error('Veritabanından cache verisi silinirken hata oluştu:', err);
              } else {
                console.log('Kullanıcının cache verisi silindi:', results);
              }
            });
          } else {
            if (!interaction.replied) {
              await interaction.reply({ content: 'Kod yanlış, yukarıdaki butona basarak tekrar deneyiniz.', flags: MessageFlags.Ephemeral });
            }
          }
        } else {
          if (!interaction.replied) {
            await interaction.reply({ content: 'Kodunuz bulunamadı, yukarıdaki koddan tekrar e-posta gönderebilirsiniz.', flags: MessageFlags.Ephemeral });
          }
        }
      });
    }
  }
});


function insertCodeIntoDatabase(discordId, email, verificationCode, domainType) {
  const query = `INSERT INTO cache (discord_id, email, verification_code, domain_type, created_at) VALUES (?, ?, ?, ?, NOW())`;
  db.execute(query, [discordId, email, verificationCode, domainType], (err, results) => {
    if (err) {
      console.error('Veritabanına kod eklenirken hata oluştu:', err);
    } else {
      console.log('Doğrulama kodu veritabanına eklendi:', results);
    }
  });
}

client.login(process.env.BOT_TOKEN);
