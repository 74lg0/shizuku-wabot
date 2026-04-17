const { Sticker, StickerTypes } = require('wa-sticker-formatter');

module.exports = {
    nombre: "sticker",
    aliases: ["s", "stiker", "stick"],
    categoria: "Utilidades",
    descripcion: "Convierte imagen o video corto en sticker",
    uso: "?s",

    ejecutar: async (sock, msg, args, { prefix }) => {
        const jid = msg.key.remoteJid;

        try {
            let mediaMsg = msg.message;

            // Soporte para mensaje citado
            if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
                mediaMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            }

            const isImage = !!mediaMsg.imageMessage;
            const isVideo = !!mediaMsg.videoMessage;

            if (!isImage && !isVideo) {
                return sock.sendMessage(jid, {
                    text: `❌ Responde a una *imagen* o *video corto* con *${prefix}s*`
                });
            }

            // === PROTECCIÓN CONTRA VIDEOS LARGOS ===
            if (isVideo) {
                const videoInfo = mediaMsg.videoMessage;
                const duration = videoInfo.seconds || 0;        // duración en segundos
                const fileSize = videoInfo.fileLength ? Number(videoInfo.fileLength) : 0;

                if (duration > 15) {   // límite conservador (WhatsApp recomienda ~10s)
                    return sock.sendMessage(jid, {
                        text: `❌ El video es demasiado largo (${duration}s).\n\nMáximo permitido: 15 segundos.`
                    });
                }

                if (fileSize > 15 * 1024 * 1024) { // 15 MB
                    return sock.sendMessage(jid, {
                        text: `❌ El video es demasiado pesado (${(fileSize/1024/1024).toFixed(1)} MB).\nMáximo recomendado: 15 MB.`
                    });
                }
            }

            // Descargar media
            const buffer = await sock.downloadMediaMessage({ message: mediaMsg });

            const sticker = new Sticker(buffer, {
                pack: "★彡[ꜱʜɪᴢᴜᴋᴜ ʙᴏᴛ]彡★",
                author: "74lg0",
                type: StickerTypes.FULL,     // FULL = normal | CIRCLE = redondo
                quality: 70,
                background: 'transparent'
            });

            const stickerBuffer = await sticker.toBuffer();

            await sock.sendMessage(jid, {
                sticker: stickerBuffer
            }, { quoted: msg });

        } catch (err) {
            console.error("Error creando sticker:", err.message);
            await sock.sendMessage(jid, {
                text: "❌ Error al procesar el archivo.\nIntenta con una imagen o un video más corto."
            });
        }
    }
};