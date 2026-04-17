const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config.json');

module.exports = {
    nombre: "welcome-event",

    ejecutar: (sock) => {
        sock.ev.on('group-participants.update', async (update) => {
            const { id, participants, action } = update;

            if (action !== 'add') return;

            // Cargar config fresco
            let config;
            try {
                config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            } catch (err) {
                console.error("❌ Error leyendo config.json:", err.message);
                return;
            }

            // Verificar si welcome está activado para este grupo
            const welcomeStatus = config.welcome?.[id];
            if (welcomeStatus !== "on") return;

            // Obtener JID del usuario de forma segura
            let usuarioJid = participants[0];
            if (typeof usuarioJid === 'object' && usuarioJid !== null) {
                usuarioJid = usuarioJid.id || usuarioJid.jid || '';
            }

            if (!usuarioJid || typeof usuarioJid !== 'string') {
                console.error("❌ No se pudo obtener el JID del nuevo participante:", participants);
                return;
            }

            const userTag = `@${usuarioJid.split('@')[0]}`;

            const mensaje = `${config.botName}
┏━━━〔 𝚂𝚈𝚂𝚃𝙴𝙼 〕━━━┓
┃ 𝓑𝓲𝓮𝓷𝓿𝓮𝓷𝓲𝓭𝓸 ┃
┣━━━━━━━━━━━━━━━━━━━┫
┃ ⟦ ${userTag} ⟧
┃ Estado :: 𝙰𝚌𝚝𝚒𝚟𝚘
┣━━━━━━━━━━━━━━━━━━━┫
┃ ⟡ 𝑳𝒆𝒆 𝒍𝒂𝒔 𝒓𝒆𝒈𝒍𝒂𝒔
┃ ⟡ 𝑼𝒔𝒂 ?menu
┃ ⟡ 𝑹𝒆𝒔𝒑𝒆𝒕𝒂 𝒆𝒍 𝒆𝒏𝒕𝒐𝒓𝒏𝒐
┣━━━━━━━━━━━━━━━━━━━┫
┃ > 𝚊𝚌𝚌𝚎𝚜𝚘 :: concedido
┗━━━━━━━━━━━━━━━━━━━┛`;

            // Ruta de la imagen
            const imagePath = path.join(__dirname, '../src/images/welcome.png');

            try {
                // Verificar que la imagen exista
                if (!fs.existsSync(imagePath)) {
                    console.error(`❌ Imagen no encontrada: ${imagePath}`);
                    // Si no hay imagen, envía solo texto
                    await sock.sendMessage(id, {
                        text: mensaje,
                        mentions: [usuarioJid]
                    });
                    return;
                }

                // Enviar imagen + texto
                await sock.sendMessage(id, {
                    image: fs.readFileSync(imagePath),
                    caption: mensaje,
                    mentions: [usuarioJid],
                    jpegThumbnail: null // opcional, Baileys lo genera solo
                });

                console.log(`✅ Bienvenida con imagen enviada a ${id}`);

            } catch (err) {
                console.error(`❌ Error enviando bienvenida con imagen en ${id}:`, err.message);
                
                // Fallback: enviar solo texto si falla la imagen
                try {
                    await sock.sendMessage(id, {
                        text: mensaje,
                        mentions: [usuarioJid]
                    });
                } catch (fallbackErr) {
                    console.error("Error en fallback de texto:", fallbackErr.message);
                }
            }
        });
    }
};