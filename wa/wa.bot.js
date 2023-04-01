let {
    hidePrivateData,
    GPT_ACTIVE,
    GPT_PREFIX,
    GPT_STATUS_PREFIX,
    MIMIN_PREFIX,
    ACTIVE_PREFIX,
    INACTIVE_PREFIX
} = require('../utils/utils')
const {gptCompletion} = require('../gpt/chat.gpt')
const makeWaSocket = require('@adiwajshing/baileys').default
const {
    DisconnectReason, useMultiFileAuthState
} = require('@adiwajshing/baileys')

const store = {}

const getMessage = key => {
    const {id} = key
    if (store[id]) return store[id].message
}

const getText = (message) => {
    try {
        return (message.conversation || message.extendedTextMessage.text)
    } catch (e) {
        console.log(e)
        return ''
    }
}

const handleActivationGPT = async (msg) => {
    const {key, pushName, message} = msg
    const text = getText(message)

    const startWithActive = text === PREFIX_ACTIVE
    const startWithInactive = text === PREFIX_INACTIVE

    if (pushName === 'Imam Mufiid') {
        if (startWithActive) {
            if (GPT_ACTIVE === false) {
                GPT_ACTIVE = true
                sendMessage(key.remoteJid, {text: "Oke siap noted Pak Bos fitur GPT sudah diaktifkan"}, {quoted: msg})
            } else {
                sendMessage(key.remoteJid, {text: "Sorry Pak Bos fitur GPT sudah aktif"}, {quoted: msg})
            }
            return
        }

        if (startWithInactive) {
            if (GPT_ACTIVE === true) {
                GPT_ACTIVE = false
                sendMessage(key.remoteJid, {text: "Oke siap noted Pak Bos fitur GPT sudah dinonaktifkan"}, {quoted: msg})
            } else {
                sendMessage(key.remoteJid, {text: "Sorry Pak Bos fitur GPT sudah tidak aktif"}, {quoted: msg})
            }
        }

    } else {
        if (key.fromMe === true) return
        sendMessage(key.remoteJid, {text: "```Exception in thread \"main\" IllegalArgumentException: Maaf anda bukan Pak Bos```"}, {quoted: msg})
    }
}

const handleGPTMessage = async (msg) => {
    const {key, message} = msg
    const text = getText(message)

    const groupRemoteJis = "@g.us"
    if (!key.remoteJid.endsWith(groupRemoteJis)) {
        sendMessage(key.remoteJid, {text: "GPT tidak bisa digunakan di chat pribadi"}, {quoted: msg})
        return
    }

    if (GPT_ACTIVE === false) {
        let reply = "Mohon maaf GPT sedang tidur..., tunggu sampai developer mengubah env ```GPT_ACTIVE``` ke ```true```"
        sendMessage(key.remoteJid, {text: reply}, {quoted: msg})
        return
    }

    let chat = text.slice(MIMIN_PREFIX.length, text.length)
    if (chat === "") return

    let completion = await gptCompletion(chat)
    let cleanedText = completion.data.choices[0].message.content.replace(/\\n/g, "\n").replace(/\\"/g, "\"");
    console.log(cleanedText)
    sendMessage(key.remoteJid, {text: cleanedText}, {quoted: msg})
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
    const {key} = msg

    const reply = "Daleemm sayang..."
    sendMessage(key.remoteJid, {text: reply}, {quoted: msg})
}

const handleTagAllMemberInGroup = async (msg) => {
    const {key} = msg

    // 1. Get group members
    const group = await sock.groupMetadata(key.remoteJid)
    const members = group.participants

    // 2. Tag them and reply
    const mentions = []
    const items = []

    members.forEach(({id, admin}) => {
        console.log(id)
        mentions.push(id)
        items.push(`@${id.split("@")[0]}${admin ? ' *(ADMIN)* ' : ''}`)
    })

    sendMessage(
        key.remoteJid,
        {text: "Daftar member group: \n\n" + items.join("\n") + `\n\nTotal member: *${mentions.length}*`, mentions},
        {quoted: msg}
    )
}

const handleMessage = async (msg) => {
    const {key, message} = msg
    const text = getText(message)

    const startWithActive = text === ACTIVE_PREFIX
    const startWithInactive = text === INACTIVE_PREFIX
    const groupRemoteJis = "@g.us"

    if (!key.remoteJid.endsWith(groupRemoteJis)) return

    if (text.toLowerCase().includes("@all")) {
        handleTagAllMemberInGroup(msg)
    } else if (text.startsWith(MIMIN_PREFIX)) {
        handleMiminMessage(msg)
    } else if (text.startsWith(GPT_PREFIX)) {
        handleGPTMessage(msg)
    } else if (startWithActive || startWithInactive) {
        handleActivationGPT(msg)
    } else if (text.startsWith(GPT_STATUS_PREFIX)) {
        const reply = `STATUS GPT: ${GPT_ACTIVE ? "*Active*" : "*Tidak aktif*"}`
        sendMessage(key.remoteJid, {text: reply}, {quoted: msg})
    }
}

const createWaBot = async () => {
    const {state, saveCreds} = await useMultiFileAuthState('auth')
    const sock = makeWaSocket({
        printQRInTerminal: true,
        auth: state,
        getMessage,
    })
    sock.ev.process(async (events) => {
        if (events["connection.update"]) {
            const {connection, lastDisconnect} = events["connection.update"]
            if (connection === 'close') {
                if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                    createWaBot()
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
                handleMessage(msg)
            })
        }
    })
}

module.exports = {createWaBot}