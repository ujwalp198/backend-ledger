const nodemailer = require("nodemailer")

let testTransporter = null

async function getTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })
    }

    if (!testTransporter) {
        try {
            const testAccount = await nodemailer.createTestAccount()
            testTransporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            })
            console.log("ℹ️ Ethereal SMTP test account initialized:", testAccount.user)
        } catch (err) {
            console.warn("Could not create Ethereal account, falling back to JSON transport:", err.message)
            testTransporter = nodemailer.createTransport({
                jsonTransport: true
            })
        }
    }
    return testTransporter
}

module.exports = { getTransporter }
