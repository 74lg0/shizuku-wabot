module.exports = {
    nombre: "quit",
    aliases: ["kick", "expulsar"],
    categoria: "Admin",
    descripcion: "Expulsa a un usuario del grupo",
    uso: "quit (respondiendo a un mensaje)",

    ejecutar: async (sock, msg, args, { config }) => {
        const jid = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;

        // ── Verificar que el sender es admin ──────────────────────────────
        let esAdmin = false;
        try {
            const metadata = await sock.groupMetadata(jid);
            const participante = metadata.participants.find(p => p.id === senderJid);
            esAdmin = participante?.admin === "admin" || participante?.admin === "superadmin";
        } catch {
            return sock.sendMessage(jid, {
                text: "❌ No se pudo verificar permisos."
            }, { quoted: msg });
        }

        if (!esAdmin) {
            return sock.sendMessage(jid, {
                text: "❌ Solo los admins pueden usar este comando."
            }, { quoted: msg });
        }

        // ── Obtener target del mensaje citado ─────────────────────────────
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant
            || msg.message?.contextInfo?.participant;

        if (!quoted) {
            return sock.sendMessage(jid, {
                text: "❌ Responde al mensaje de alguien para expulsarlo."
            }, { quoted: msg });
        }

        // ── Expulsar ──────────────────────────────────────────────────────
        try {
            await sock.groupParticipantsUpdate(jid, [quoted], "remove");
            await sock.sendMessage(jid, {
                text: `✅ @${quoted.split("@")[0]} ha sido expulsado.`,
                mentions: [quoted]
            });
        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ No se pudo expulsar.\n*Motivo:* ${err.message}`
            }, { quoted: msg });
        }
    }
};