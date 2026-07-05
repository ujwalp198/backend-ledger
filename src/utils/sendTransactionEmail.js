const sendEmail = require("./sendEmail")

async function sendTransactionEmail(email, transaction, newBalance) {
    const subject = `Transaction Completed: ${transaction.type}`
    const text = `Your transaction of $${transaction.amount} has been completed successfully. Your new balance is $${newBalance}.`
    const html = `
        <h2>Transaction Completed</h2>
        <p>Your <strong>${transaction.type}</strong> of <strong>$${transaction.amount}</strong> has been completed successfully.</p>
        <p><strong>New Balance:</strong> $${newBalance}</p>
        <p>Thank you for using Backend Ledger.</p>
    `

    return sendEmail({ to: email, subject, text, html })
}

module.exports = sendTransactionEmail
