const User = require("../models/User")
const Account = require("../models/Account")
const Blacklist = require("../models/Blacklist")
const { hashPassword, comparePassword } = require("../utils/passwordHash")
const {
    generateToken,
    setAuthCookie,
    clearAuthCookie
} = require("../utils/generateToken")
const sendRegistrationEmail = require("../utils/sendRegistrationEmail")

function sendAuthResponse(res, statusCode, message, user, token, account = null) {
    setAuthCookie(res, token)

    const response = {
        success: true,
        message,
        token,
        user: {
            id: user._id,
            email: user.email
        }
    }

    if (account) {
        response.account = {
            id: account._id,
            accountName: account.accountName,
            balance: account.balance,
            currency: account.currency
        }
    }

    return res.status(statusCode).json(response)
}

async function register(req, res) {
    try {
        const { email, password, accountName } = req.body
        const normalizedEmail = email.trim().toLowerCase()

        const existingUser = await User.findOne({ email: normalizedEmail })
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            })
        }

        const hashedPassword = await hashPassword(password)
        const user = await User.create({
            email: normalizedEmail,
            password: hashedPassword
        })

        const account = await Account.create({
            user: user._id,
            accountName: accountName?.trim() || "Main Account"
        })

        try {
            await sendRegistrationEmail(user.email, account.accountName)
        } catch (emailError) {
            console.error("Registration email failed:", emailError.message)
        }

        const token = generateToken(user._id)
        return sendAuthResponse(
            res,
            201,
            "User registered successfully",
            user,
            token,
            account
        )
    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message
        })
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body
        const normalizedEmail = email.trim().toLowerCase()

        const user = await User.findOne({ email: normalizedEmail }).select("+password")
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            })
        }

        const isPasswordMatch = await comparePassword(password, user.password)
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            })
        }

        const account = await Account.findOne({ user: user._id }).sort({ createdAt: 1 })
        const token = generateToken(user._id)

        return sendAuthResponse(res, 200, "Login successful", user, token, account)
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message
        })
    }
}

async function getMe(req, res) {
    const account = await Account.findOne({ user: req.user._id }).sort({ createdAt: 1 })

    return res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            email: req.user.email
        },
        account: account
            ? {
                id: account._id,
                accountName: account.accountName,
                balance: account.balance,
                currency: account.currency
            }
            : null
    })
}

async function logout(req, res) {
    try {
        const authHeader = req.headers.authorization
        const bearerToken = authHeader?.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : null
        const token = req.cookies?.token || bearerToken

        if (token) {
            await Blacklist.create({ token })
        }

        clearAuthCookie(res)

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Logout failed",
            error: error.message
        })
    }
}

module.exports = { register, login, getMe, logout }
