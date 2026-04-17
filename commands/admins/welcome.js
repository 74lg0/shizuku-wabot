const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config.json');

module.exports = {
    nombre: "welcome",
    aliases: ["bienvenida"],
    categoria: "Grupo",
    descripcion: "Activa o desactiva el mensaje de bienvenida automática",
    uso: "welcome on / welcome off",

    ejecutar: async (sock, msg, args, { prefix, config }) => {
        
        const jid = msg.key.remoteJid;
        const sender = msg.sender || msg.key.participant;

        // Verificar admin o owner
        let isAdmin = false;
        try {
            const groupMetadata = await sock.groupMetadata(jid);
            isAdmin = groupMetadata.participants.some(p => 
                p.id === sender && (p.admin === "admin" || p.admin === "superadmin")
            );
        } catch (err) {
            console.error("Error al obtener metadata:", err.message);
        }

        const isOwner = sender === config.ownerNumber + "@s.whatsapp.net";

        if (!isAdmin && !isOwner) {
            return sock.sendMessage(jid, { 
                text: "❌ Solo los administradores pueden usar este comando." 
            });
        }

        const accion = args[0] ? args[0].toLowerCase() : "";

        // Cargar config actual
        let currentConfig;
        try {
            currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } catch (err) {
            return sock.sendMessage(jid, { text: "❌ Error al leer la configuración." });
        }

        if (accion === "on") {
            currentConfig.welcome[jid] = "on";
            fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 4));
            
            await sock.sendMessage(jid, { 
                text: "✅ *Mensaje de bienvenida activado* correctamente." 
            });
        } 
        else if (accion === "off") {
            delete currentConfig.welcome[jid];   // o poner "off" si prefieres
            fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 4));
            
            await sock.sendMessage(jid, { 
                text: "❌ *Mensaje de bienvenida desactivado*." 
            });
        } 
        else {
            const estadoActual = currentConfig.welcome[jid] === "on" ? "Activado ✅" : "Desactivado ❌";
            await sock.sendMessage(jid, { 
                text: `Estado actual: *${estadoActual}*\n\nUso:\n${prefix}welcome on\n${prefix}welcome off` 
            });
        }
    }
};