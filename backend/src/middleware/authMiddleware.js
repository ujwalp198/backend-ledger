const { verifyToken } = require("../utils/generateToken")
const User = require("../models/User")
const Blacklist = require("../models/Blacklist")

async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization
        const bearerToken = authHeader?.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : null
        const token = req.cookies?.token || bearerToken

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            })
        }

        const isBlacklisted = await Blacklist.findOne({ token })
        if (isBlacklisted) {
            return res.status(401).json({
                success: false,
                message: "Session expired, please log in again"
            })
        }

        const decoded = verifyToken(token)
        const user = await User.findById(decoded.userId)

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            })
        }

        req.user = user
        next()
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        })
    }
}

module.exports = authenticate
