const bcrypt = require("bcrypt")

const SALT_ROUNDS = 10

async function hashPassword(password) {
    if (typeof password !== "string" || password.length === 0) {
        throw new Error("Password must be a non-empty string")
    }

    return bcrypt.hash(password, SALT_ROUNDS)
}

async function comparePassword(password, hashedPassword) {
    if (typeof password !== "string" || typeof hashedPassword !== "string") {
        return false
    }

    return bcrypt.compare(password, hashedPassword)
}

module.exports = { hashPassword, comparePassword, SALT_ROUNDS }
