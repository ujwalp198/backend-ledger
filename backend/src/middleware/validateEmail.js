const { isValidEmail } = require("../utils/emailValidator")

function validateEmail(req, res, next) {
    const email = req.body?.email

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required"
        })
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email format"
        })
    }

    next()
}

module.exports = validateEmail
