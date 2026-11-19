const Account = require("../models/Account")
const { deriveBalance } = require("../utils/deriveBalance")

async function getAccounts(req, res) {
    try {
        const accounts = await Account.find({ user: req.user._id }).sort({ createdAt: 1 })
        
        return res.status(200).json({
            success: true,
            count: accounts.length,
            accounts
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch accounts",
            error: error.message
        })
    }
}

async function createAccount(req, res) {
    try {
        const { accountName, currency } = req.body

        if (!accountName) {
            return res.status(400).json({
                success: false,
                message: "Account name is required"
            })
        }

        const existingAccount = await Account.findOne({ 
            user: req.user._id, 
            accountName: accountName.trim() 
        })

        if (existingAccount) {
            return res.status(409).json({
                success: false,
                message: "You already have an account with this name"
            })
        }

        const account = await Account.create({
            user: req.user._id,
            accountName: accountName.trim(),
            currency: currency || "USD"
        })

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            account
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create account",
            error: error.message
        })
    }
}

async function getBalance(req, res) {
    try {
        const { accountId } = req.params

        const account = await Account.findOne({ _id: accountId, user: req.user._id })
        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found or unauthorized"
            })
        }

        const balance = await deriveBalance(account._id)

        return res.status(200).json({
            success: true,
            accountId: account._id,
            balance
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch balance",
            error: error.message
        })
    }
}

module.exports = { getAccounts, createAccount, getBalance }
