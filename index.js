console.clear();
// Memuat konfigurasi global dari public/settings/config.js.
// Pastikan file ini ada dan berisi pengaturan yang dibutuhkan (misalnya BOT_TOKEN untuk Telegram).
require('./public/settings/config'); 

console.log('Annas API Server is starting...');

// Menangani uncaught exceptions untuk mencegah aplikasi Node.js crash secara tiba-tiba.
// Ini adalah praktik yang baik untuk aplikasi produksi, tetapi memerlukan penanganan error yang lebih canggih.
process.on("uncaughtException", console.error);

// Mengimpor modul-modul yang diperlukan dari Baileys dan Node.js.
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidDecode, // Untuk mendekode JID WhatsApp
    // Impor lain yang Anda miliki sebelumnya (misalnya prepareWAMessageMedia, dll.)
    // Saya hanya menyertakan yang paling penting untuk fungsionalitas dasar di sini.
} = require("@whiskeysockets/baileys");

const pino = require('pino'); // Logger yang efisien untuk Node.js.
const readline = require("readline"); // Untuk mendapatkan input dari konsol (misalnya nomor telepon).
const fs = require('fs'); // Modul File System untuk operasi file.
const express = require("express"); // Framework web untuk membangun API RESTful.
const bodyParser = require('body-parser'); // Middleware untuk mengurai body request HTTP.
const cors = require("cors"); // Middleware untuk mengizinkan Cross-Origin Resource Sharing.
const path = require("path"); // Modul untuk bekerja dengan path file dan direktori.

const app = express(); // Membuat instance aplikasi Express.
const PORT = process.env.PORT || 5036; // Port server, default ke 5036.

// Memuat fungsi-fungsi spesifik API dari folder 'public'.
// Pastikan path ini benar relatif terhadap `index.js`.
const { carousels2, forceCall } = require('./public/service/bugs');
const { getRequest, sendTele } = require('./public/engine/telegram');
const { konek } = require('./public/connection/connect'); // Memuat logika koneksi Baileys Anda.

// Konfigurasi aplikasi Express.
app.enable("trust proxy"); // Mengaktifkan header X-Forwarded-For untuk load balancers.
app.set("json spaces", 2); // Mengatur indentasi JSON response untuk keterbacaan.
app.use(cors()); // Menggunakan middleware CORS agar frontend dapat mengakses API.
app.use(express.urlencoded({   
  extended: true   // Mengurai URL-encoded bodies dengan pustaka qs.
})); 
app.use(express.json()); // Mengurai JSON bodies.

// Mengatur folder statis agar file frontend (HTML, CSS, JS) dapat diakses oleh browser.
// `express.static(__dirname)` melayani file dari direktori di mana `index.js` berada.
app.use(express.static(__dirname)); 
// Melayani folder 'public' di bawah path '/public'. Ini penting untuk aset internal Baileys.
app.use('/public', express.static(path.join(__dirname, 'public'))); 

// Menggunakan bodyParser untuk mengurai raw bodies (misalnya untuk file upload besar).
app.use(bodyParser.raw({   
  limit: '50mb',   // Batas ukuran body request.
  type: '*/*'      // Menerima semua tipe konten.
}));

const { Boom } = require('@hapi/boom'); // Mengimpor Boom untuk penanganan error Baileys yang terstruktur.
const usePairingCode = true; // Flag untuk menggunakan Pairing Code (opsional).

// Fungsi utilitas untuk mendapatkan input dari konsol.
const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,   // Menggunakan stdin sebagai input
        output: process.stdout  // Menggunakan stdout sebagai output
    });
    return new Promise((resolve) => {  
        rl.question(text, resolve);   // Menanyakan pertanyaan dan resolve dengan jawaban
    });  
};

/**
 * Fungsi utama untuk memulai koneksi Baileys WhatsApp client.
 * Ini akan mengelola autentikasi, koneksi, dan peristiwa Baileys.
 */
async function clientstart() {
	// Menggunakan MultiFileAuthState untuk menyimpan dan memuat kredensial sesi WhatsApp.
	// Kredensial akan disimpan di folder './session'.
	const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    // Mengambil versi Baileys terbaru untuk memastikan kompatibilitas.
    const { version, isLatest } = await fetchLatestBaileysVersion(); 
    
    // Membuat instance WhatsApp client.
    const client = makeWASocket({
        logger: pino({ level: "silent" }), // Menggunakan pino logger, level 'silent' untuk output minimal di konsol.
        printQRInTerminal: false, // Tidak mencetak QR code di terminal karena kita akan menggunakan pairing code.
        auth: state, // Menggunakan state autentikasi yang dimuat.
        browser: ["Ubuntu", "Chrome", "20.0.00"] // Mengatur User-Agent browser untuk koneksi.
    });
      
    // Meminta pairing code jika kredensial belum terdaftar (login pertama kali).
    if (!client.authState.creds.registered) {
        const phoneNumber = await question('Please enter your WhatsApp number (e.g., 62812xxxx): ');  
        // Meminta pairing code dari server WhatsApp.
        const code = await client.requestPairingCode(phoneNumber, "KIUU1234"); // 'KIUU1234' adalah kode kustom.
        console.log(`Your WhatsApp pairing code: ${code}`); // Menampilkan kode untuk dimasukkan di perangkat Anda.
    }

    // --- Definisi Endpoint API ---
    // Endpoint GET untuk mengirim 'carousels' WhatsApp.
    app.get('/api/bug/carousels', async (req, res) => {
        const { target, fjids } = req.query; // Mengambil parameter dari query string.
        
        // Validasi parameter yang diperlukan.
        if (!target) return res.status(400).json({ status: false, message: "Parameter 'target' diperlukan." });
        if (!fjids) return res.status(400).json({ status: false, message: "Parameter 'fjids' (carousel item IDs) diperlukan." });
        
        let cleanedTarget = target.replace(/[^0-9]/g, ""); // Menghapus karakter non-digit dari nomor.
        if (cleanedTarget.startsWith("0")) return res.status(400).json({ status: false, message: "Gunakan awalan kode negara (misal, 62) bukan '0'." });

        let whatsappJid = cleanedTarget + '@s.whatsapp.net'; // Format menjadi JID WhatsApp.
        const requestInfo = await getRequest(req); // Mendapatkan informasi detail request untuk monitoring.

        try {
            await carousels2(client, whatsappJid, fjids); // Memanggil fungsi untuk mengirim carousels.
            res.json({
                status: true,
                creator: global.creator || "Annas API", // Gunakan global.creator jika ada
                message: "Carousel message sent successfully.",
                target: target // Mengembalikan target untuk konfirmasi
            });
            console.log(`[API] Successfully sent carousels to ${whatsappJid}`);
            // Mengirim notifikasi ke Telegram untuk monitoring API hit.
            const telegramMessage = `
            \n[API HIT - Carousels2]
            Endpoint: /api/bug/carousels
            Target: ${target}
            IP: ${requestInfo.ip}
            Method: ${requestInfo.method}
            Timestamp: ${requestInfo.timestamp}
            
            This is an automated API monitoring alert.
            `;
            sendTele(telegramMessage); // Mengirim pesan ke Telegram.
        } catch (error) {
            console.error(`[API ERROR - Carousels2] Failed to send carousels to ${whatsappJid}:`, error);
            res.status(500).json({
                status: false,
                message: "Terjadi kesalahan saat mengirim pesan karosel.",
                error: error.message
            });
        }
    });  
    
    // Endpoint GET untuk melakukan 'forcecall' WhatsApp.
    app.get('/api/bug/forcecall', async (req, res) => {
        const { target } = req.query; // Mengambil parameter 'target'.
        
        if (!target) return res.status(400).json({ status: false, message: "Parameter 'target' diperlukan." });
        
        let cleanedTarget = target.replace(/[^0-9]/g, "");
        if (cleanedTarget.startsWith("0")) return res.status(400).json({ status: false, message: "Gunakan awalan kode negara (misal, 62) bukan '0'." });

        let whatsappJid = cleanedTarget + '@s.whatsapp.net';
        const requestInfo = await getRequest(req);

        try {
            await forceCall(client, whatsappJid); // Memanggil fungsi untuk force call.
            res.json({
                status: true,
                creator: global.creator || "Annas API",
                message: "Force call initiated successfully.",
                target: target
            });
            console.log(`[API] Successfully initiated force call to ${whatsappJid}`);
            // Mengirim notifikasi ke Telegram.
            const telegramMessage = `
            \n[API HIT - Forcecall]
            Endpoint: /api/bug/forcecall
            Target: ${target}
            IP: ${requestInfo.ip}
            Method: ${requestInfo.method}
            Timestamp: ${requestInfo.timestamp}
            
            This is an automated API monitoring alert.
            `;
            sendTele(telegramMessage);
        } catch (error) {
            console.error(`[API ERROR - Forcecall] Failed to initiate force call to ${whatsappJid}:`, error);
            res.status(500).json({
                status: false,
                message: "Terjadi kesalahan saat memulai panggilan paksa.",
                error: error.message
            });
        }
    });  
   
    // Event listener untuk update koneksi Baileys.
    client.ev.on('connection.update', (update) => {
        // Memanggil fungsi `konek` dari modul public/connection/connect untuk menangani status koneksi.
        konek({ 
            client, 
            update, 
            clientstart, // Pass clientstart to allow reconnect logic
            DisconnectReason, // Baileys DisconnectReason enum
            Boom // Baileys Boom error handler
        });  
    });  
    
    // Event listener untuk menyimpan kredensial Baileys saat ada update.
    client.ev.on('creds.update', saveCreds);  
    return client; // Mengembalikan instance client Baileys.
}
      
// Memulai koneksi Baileys client saat server Node.js pertama kali dijalankan.
clientstart();

// --- Konfigurasi Server Express ---
// Route untuk melayani file HTML utama saat ada request ke root URL ("/").
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Memulai server Express untuk mendengarkan request HTTP.
app.listen(PORT, () => {
  console.log(`Annas API server is running on http://localhost:${PORT}`);
  console.log(`Access the API documentation at: http://localhost:${PORT}`);
}).on('error', (err) => {
  // Menangani error jika port sudah digunakan (EADDRINUSE).
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use. Trying another random port...`);
    // Mencoba port acak baru antara 1024 dan 65535.
    const newPort = Math.floor(Math.random() * (65535 - 1024) + 1024);
    app.listen(newPort, () => {
      console.log(`Annas API server is now running on http://localhost:${newPort}`);
      console.log(`Access the API documentation at: http://localhost:${newPort}`);
    });
  } else {
    // Menangani error lainnya.
    console.error('An unexpected error occurred while starting the server:', err.message);
  }
});

// --- Hot Reloading (Auto-Restart Server on File Change) ---
// Memantau file `index.js` ini untuk perubahan. Jika diubah, server akan di-restart.
let fileToWatch = require.resolve(__filename);
fs.watchFile(fileToWatch, () => {  
  fs.unwatchFile(fileToWatch);  
  console.log('\x1b[0;32m'+ fileToWatch +' \x1b[1;32mupdated! Restarting server...\x1b[0m');  
  delete require.cache[fileToWatch];  // Menghapus cache modul.
  require(fileToWatch);  // Memuat ulang modul.
});