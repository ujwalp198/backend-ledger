const { getTransporter } = require("../config/mailer")
const nodemailer = require("nodemailer")

async function sendEmail({ to, subject, text, html, attachments = [] }) {
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || "Nexus Ledger <notifications@nexusledger.com>"
    const transport = await getTransporter()

    const info = await transport.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html,
        attachments
    })

    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null
    if (previewUrl) {
        console.log(`📨 [Email Sent] Preview URL: ${previewUrl}`)
    } else {
        console.log(`📨 [Email Sent] Delivered to ${to} (ID: ${info.messageId})`)
    }

    return { ...info, previewUrl }
}

module.exports = sendEmail
