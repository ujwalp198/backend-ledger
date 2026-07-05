const Account = require("../models/Account")

async function accountStatusMiddleware(req, res, next) {
    try {
        const accountId = req.body.accountId || req.params.accountId

        if (!accountId) {
            return next()
        }

        const account = await Account.findById(accountId)
        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found"
            })
        }

        if (account.status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message: `Account is ${account.status}. Operations are not permitted.`
            })
        }

        // Attach account to request so we don't need to look it up again in the controller
        req.account = account
        next()
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to validate account status",
            error: error.message
        })
    }
}

module.exports = accountStatusMiddleware
