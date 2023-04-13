const {createWaBot} = require('./wa/wa.bot')
const {TIME_LIMIT_RUNNING, dateFormat} = require('./utils/utils')

createWaBot()

const getOneHourLater = (date) => {
    const specificDate = new Date(date); // membuat objek Date dengan waktu tertentu
    const oneHourLater = new Date(specificDate.getTime() + TIME_LIMIT_RUNNING);
    return `${dateFormat(oneHourLater)}`
}

const dateRun = new Date()
console.log("******** Server berjalan ********")
console.log(JSON.stringify({start: dateFormat(dateRun), end: getOneHourLater(dateRun)}, null, 4))
console.log("******** ******* ******* ********")

setTimeout(() => {
    console.log("******** Server berhenti " + new Date() + " ********")
    process.exit(0);
}, TIME_LIMIT_RUNNING) // 1 hours