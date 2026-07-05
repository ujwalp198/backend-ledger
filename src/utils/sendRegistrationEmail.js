const sendEmail = require("./sendEmail")

async function sendRegistrationEmail(email, accountName) {
    const subject = "Welcome to Backend Ledger"
    const text = `Your account "${accountName}" has been created successfully. You can now log in and start managing your ledger.`
    const html = `
        <h2>Welcome to Backend Ledger</h2>
        <p>Your account <strong>${accountName}</strong> has been created successfully.</p>
        <p>You can now log in and start managing your ledger.</p>
    `

    return sendEmail({ to: email, subject, text, html })
}

module.exports = sendRegistrationEmail
