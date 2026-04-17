const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const path = require("path");

const { cargarComandos } = require("./commands/loader");
const { manejarMensajes } = require("./handlers/messageHandler");
const { manejarConexion } = require("./handlers/connectionHandler");

// ── Cargar config ─────────────────────────────────────────────────────────────
const CONFIG_PATH = "./config.json";
if (!fs.existsSync(CONFIG_PATH)) {
    console.error("❌ No se encontró config.json en la raíz del proyecto");
    process.exit(1);
}
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

// ── Cargar comandos ───────────────────────────────────────────────────────────
const comandos = cargarComandos();
console.log(`[!] ${comandos.size} entradas de comandos cargadas\n`);

// ── Función para cargar eventos ───────────────────────────────────────────────
function cargarEventos(sock) {
    const eventsPath = path.join(__dirname, 'events');
    
    if (!fs.existsSync(eventsPath)) {
        fs.mkdirSync(eventsPath);
        console.log("📁 Carpeta 'events/' creada automáticamente.");
        return;
    }

    const archivos = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const archivo of archivos) {
        try {
            const evento = require(path.join(eventsPath, archivo));
            if (evento.ejecutar && typeof evento.ejecutar === 'function') {
                evento.ejecutar(sock);
                console.log(`✅ Evento cargado → ${evento.nombre || archivo}`);
            }
        } catch (err) {
            console.error(`❌ Error al cargar evento ${archivo}:`, err.message);
        }
    }
}

// ── Arranque del bot ──────────────────────────────────────────────────────────
async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Debian", "Firefox", "120.0.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    manejarConexion(sock, iniciarBot);
    manejarMensajes(sock, comandos, config);
    iniciarScheduler(sock);

    // ←←← Cargar eventos aquí (después de crear el sock)
    cargarEventos(sock);

    console.log(`[!] Bot iniciado | Prefijo: "${config.defaultPrefix}" | v${version.join(".")}`);
}

iniciarBot();