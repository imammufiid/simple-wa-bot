const hidePrivateData = (data) =>
    JSON.parse(
        JSON.stringify(data)
            .replace(/"\d{10}/g, (m) => `"${m.slice(1, 3)}xxxxxxxx`)
    )

const dateFormat = (date) => {
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    return date.toLocaleString("en-GB", options)
}

let GPT_ACTIVE = false
const MIMIN_PREFIX = "!mimin"
const GPT_PREFIX = "!gpt"
const GPT_STATUS_PREFIX = "!statusgpt"
const ACTIVE_PREFIX = "!activategpt"
const INACTIVE_PREFIX = "!deactivategpt"
const BUKBER_PREFIX = "!regbukber"
const TIME_LIMIT_RUNNING = (60 * 60 * 1000)

module.exports = {
    hidePrivateData,
    dateFormat,
    GPT_PREFIX,
    GPT_STATUS_PREFIX,
    ACTIVE_PREFIX,
    INACTIVE_PREFIX,
    TIME_LIMIT_RUNNING,
    GPT_ACTIVE,
    MIMIN_PREFIX,
    BUKBER_PREFIX
}