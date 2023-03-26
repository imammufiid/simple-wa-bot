const {hidePrivateData} = require('./utils/utils')
const makeWaSocket = require('@adiwajshing/baileys').default
const {
    DisconnectReason, useMultiFileAuthState
} = require('@adiwajshing/baileys')

const store = {}

const getMessage = key => {
    const {id} = key
    if (store[id]) return store[id].message
}

async function init() {
    const {state, saveCreds} = await useMultiFileAuthState('auth')
    const sock = makeWaSocket({
        printQRInTerminal: true,
        auth: state,
        getMessage,
    })

    const getText = (message) => {
        try {
            return (message.conversation || message.extendedTextMessage.text)
        } catch (e) {
            console.log(e)
            return ''
        }
    }

    const sendMessage = async (jid, content, ...args) => {
        try {
            const sent = await sock.sendMessage(jid, content, ...args)
            store[sent.key.id] = sent
        } catch (e) {
            console.log("Error sending message: ", e)
        }
    }

    const handleMiminMessage = async (msg) => {
        const {key, message} = msg
        const text = getText(message)

        const MIMIN_PREFIX = "!mimin"
        if (!text.startsWith(MIMIN_PREFIX)) return

        const reply = "Daleemm sayang..."
        sendMessage(key.remoteJid, {text: reply}, {quoted: msg})
    }

    const handleTagAllMemberInGroup = async (msg) => {
        const {key, message} = msg
        const text = getText(message)

        if (!text.toLowerCase().includes("@all")) return

        // 1. Get group members
        const group = await sock.groupMetadata(key.remoteJid)
        const members = group.participants

        // 2. Tag them and reply
        const mentions = []
        const items = []

        members.forEach(({ id, admin }) => {
            mentions.push(id)
            items.push(`@${id.slice(0, 13)}${admin ? ' *(ADMIN)* ' : ''}`)
        })

        sendMessage(
            key.remoteJid,
            {text: "Daftar member group: \n\n" + items.join("\n") + `\n\nTotal member: *${mentions.length}*`, mentions},
            {quoted: msg}
        )
    }

    sock.ev.process(async (events) => {
        if (events["connection.update"]) {
            const {connection, lastDisconnect} = events["connection.update"]
            if (connection === 'close') {
                if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                    init()
                } else {
                    console.log("Disconnected because you logged out")
                }
            }
        }

        if (events["creds.update"]) {
            await saveCreds()
        }

        if (events["messages.upsert"]) {
            const {messages} = events["messages.upsert"]

            messages.forEach(msg => {
                if (!msg.message) return
                // processing
                console.log(hidePrivateData(msg))
                handleTagAllMemberInGroup(msg)
                handleMiminMessage(msg)
            })
        }
    })
}

init()