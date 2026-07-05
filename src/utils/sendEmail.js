const transporter = require("../config/mailer")

async function sendEmail({ to, subject, text, html }) {
    if (!process.env.EMAIL_FROM) {
        throw new Error("EMAIL_FROM is not defined")
    }

    return transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
        html
    })
}

module.exports = sendEmail
