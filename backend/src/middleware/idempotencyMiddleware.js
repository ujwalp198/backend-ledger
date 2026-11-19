const Transaction = require("../models/Transaction")

async function idempotencyMiddleware(req, res, next) {
    if (req.method !== "POST") {
        return next()
    }

    const idempotencyKey = req.headers["idempotency-key"]
    if (!idempotencyKey) {
        return next()
    }

    try {
        const existingTransaction = await Transaction.findOne({ idempotencyKey, user: req.user._id })
        if (existingTransaction) {
            return res.status(200).json({
                success: true,
                message: "Transaction already processed",
                transaction: existingTransaction,
                idempotent: true
            })
        }

        req.idempotencyKey = idempotencyKey
        next()
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Idempotency validation failed",
            error: error.message
        })
    }
}

module.exports = idempotencyMiddleware
