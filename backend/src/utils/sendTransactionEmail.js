const sendEmail = require("./sendEmail")
const generateTransactionPDF = require("./generatePDF")

async function sendTransactionEmail(email, transaction, newBalance) {
    const subject = `Nexus Ledger: Receipt for ${transaction.type} of $${Number(transaction.amount).toFixed(2)}`
    const text = `Your transaction of $${transaction.amount} (${transaction.type}) has been completed. New Balance: $${newBalance}. Your receipt PDF is attached.`
    
    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #1e1b4b; margin: 0; font-size: 22px; letter-spacing: 1px;">NEXUS LEDGER</h1>
                <p style="color: #6366f1; margin: 4px 0 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">Official Transaction Notice</p>
            </div>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 0; color: #64748b;">Transaction ID</td>
                        <td style="padding: 10px 0; font-family: monospace; font-size: 12px; text-align: right; color: #0f172a;">${transaction._id}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 0; color: #64748b;">Type</td>
                        <td style="padding: 10px 0; font-weight: 600; text-align: right; color: #0f172a;">${transaction.type}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 0; color: #64748b;">Amount</td>
                        <td style="padding: 10px 0; font-weight: 700; text-align: right; font-size: 16px; color: ${transaction.type === 'WITHDRAWAL' ? '#dc2626' : '#16a34a'};">
                            ${transaction.type === 'WITHDRAWAL' ? '-' : '+'}$${Number(transaction.amount).toFixed(2)}
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 0; color: #64748b;">Status</td>
                        <td style="padding: 10px 0; font-weight: 600; text-align: right; color: #16a34a;">COMPLETED</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #64748b;">Closing Balance</td>
                        <td style="padding: 10px 0; font-weight: 700; text-align: right; color: #4338ca; font-size: 15px;">$${Number(newBalance || 0).toFixed(2)}</td>
                    </tr>
                </table>
            </div>

            <p style="font-size: 13px; color: #475569; line-height: 1.5; margin-bottom: 16px;">
                📎 <strong>Receipt Attached:</strong> A formal PDF transaction receipt (<strong>Receipt_${transaction._id}.pdf</strong>) has been generated and attached to this email for your financial records.
            </p>

            <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
                <p style="font-size: 11px; color: #94a3b8; margin: 0;">Nexus Ledger Automated Financial System • Please do not reply directly to this email.</p>
            </div>
        </div>
    `

    // Generate PDF Buffer
    const pdfBuffer = await generateTransactionPDF(transaction, newBalance)

    const attachments = [
        {
            filename: `Receipt_${transaction._id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        }
    ]

    return sendEmail({ to: email, subject, text, html, attachments })
}

module.exports = sendTransactionEmail
