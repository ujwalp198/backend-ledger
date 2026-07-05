function validatePassword(req, res, next) {
    const password = req.body?.password

    if (!password) {
        return res.status(400).json({
            success: false,
            message: "Password is required"
        })
    }

    if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters"
        })
    }

    next()
}

module.exports = validatePassword
