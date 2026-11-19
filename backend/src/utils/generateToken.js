const jwt = require("jsonwebtoken")

const JWT_EXPIRES_IN = "7d"
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

function generateToken(userId) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined")
    }

    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function verifyToken(token) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined")
    }

    return jwt.verify(token, process.env.JWT_SECRET)
}

function setAuthCookie(res, token) {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: COOKIE_MAX_AGE
    })
}

function clearAuthCookie(res) {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    })
}

module.exports = {
    generateToken,
    verifyToken,
    setAuthCookie,
    clearAuthCookie,
    JWT_EXPIRES_IN,
    COOKIE_MAX_AGE
}
