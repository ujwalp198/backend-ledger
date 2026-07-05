const mongoose = require("mongoose")
const Transaction = require("../models/Transaction")
const Ledger = require("../models/Ledger")
const Account = require("../models/Account")
const User = require("../models/User")
const deriveBalance = require("../utils/deriveBalance")
const sendTransactionEmail = require("../utils/sendTransactionEmail")

async function createTransaction(req, res) {
    try {
        const { type, amount, description, accountId, toAccountId } = req.body
        const { idempotencyKey } = req

        if (!type || !amount || !accountId) {
            return res.status(400).json({
                success: false,
                message: "Type, amount, and accountId are required"
            })
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than zero"
            })
        }

        const account = req.account
        if (account.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access to account"
            })
        }

        const currentBalance = await deriveBalance(account._id)

        let transaction
        let toAccount

        // Create transaction in PENDING state without Ledger entries
        if (type === "WITHDRAWAL") {
            if (currentBalance < amount) {
                return res.status(400).json({ success: false, message: "Insufficient funds" })
            }
            transaction = await Transaction.create({ 
                user: req.user._id, account: account._id, type, amount, description, idempotencyKey 
            })

        } else if (type === "DEPOSIT") {
            transaction = await Transaction.create({ 
                user: req.user._id, account: account._id, type, amount, description, idempotencyKey 
            })

        } else if (type === "TRANSFER") {
            if (!toAccountId) {
                return res.status(400).json({ success: false, message: "toAccountId is required for TRANSFER" })
            }
            if (currentBalance < amount) {
                return res.status(400).json({ success: false, message: "Insufficient funds for transfer" })
            }
            toAccount = await Account.findById(toAccountId)
            if (!toAccount) {
                return res.status(404).json({ success: false, message: "Destination account not found" })
            }
            if (toAccount.status !== "ACTIVE") {
                return res.status(403).json({ success: false, message: "Destination account is not active" })
            }

            transaction = await Transaction.create({ 
                user: req.user._id, account: account._id, toAccount: toAccount._id, type, amount, description, idempotencyKey 
            })
        } else {
            return res.status(400).json({ success: false, message: "Invalid transaction type" })
        }

        return res.status(201).json({
            success: true,
            message: `${type} initiated and is PENDING`,
            transaction
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Transaction creation failed",
            error: error.message
        })
    }
}

async function completeTransaction(req, res) {
    try {
        const { transactionId } = req.params

        const transaction = await Transaction.findOne({ _id: transactionId, user: req.user._id })
        if (!transaction) {
            return res.status(404).json({ success: false, message: "Transaction not found" })
        }

        if (transaction.status === "COMPLETED") {
            return res.status(400).json({ success: false, message: "Transaction is already completed" })
        }
        
        if (transaction.status === "FAILED") {
            return res.status(400).json({ success: false, message: "Transaction has failed and cannot be completed" })
        }

        const account = await Account.findById(transaction.account)
        if (!account || account.status !== "ACTIVE") {
            return res.status(403).json({ success: false, message: "Source account is invalid or inactive" })
        }

        const currentBalance = await deriveBalance(account._id)

        if (transaction.type === "WITHDRAWAL" || transaction.type === "TRANSFER") {
            if (currentBalance < transaction.amount) {
                transaction.status = "FAILED"
                await transaction.save()
                return res.status(400).json({ success: false, message: "Insufficient funds at time of completion" })
            }
        }

        if (transaction.type === "WITHDRAWAL") {
            await Ledger.create({ transactionId: transaction._id, account: account._id, entryType: "DEBIT", amount: transaction.amount })
            account.balance = currentBalance - transaction.amount
            await account.save()

        } else if (transaction.type === "DEPOSIT") {
            await Ledger.create({ transactionId: transaction._id, account: account._id, entryType: "CREDIT", amount: transaction.amount })
            account.balance = currentBalance + transaction.amount
            await account.save()

        } else if (transaction.type === "TRANSFER") {
            const toAccount = await Account.findById(transaction.toAccount)
            if (!toAccount || toAccount.status !== "ACTIVE") {
                transaction.status = "FAILED"
                await transaction.save()
                return res.status(403).json({ success: false, message: "Destination account is invalid or inactive" })
            }

            // Debit sender
            await Ledger.create({ transactionId: transaction._id, account: account._id, entryType: "DEBIT", amount: transaction.amount })
            account.balance = currentBalance - transaction.amount
            await account.save()

            // Credit receiver
            await Ledger.create({ transactionId: transaction._id, account: toAccount._id, entryType: "CREDIT", amount: transaction.amount })
            const receiverDerivedBalance = await deriveBalance(toAccount._id)
            toAccount.balance = receiverDerivedBalance + transaction.amount
            await toAccount.save()
        }

        transaction.status = "COMPLETED"
        await transaction.save()

        // Send Email
        try {
            await sendTransactionEmail(req.user.email, transaction, account.balance)
        } catch (emailError) {
            console.error("Failed to send transaction email:", emailError.message)
            // We do not fail the request if just the email fails
        }

        return res.status(200).json({
            success: true,
            message: "Transaction completed successfully",
            transaction,
            newBalance: account.balance
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Transaction completion failed",
            error: error.message
        })
    }
}

async function getTransactions(req, res) {
    try {
        const { accountId } = req.params

        const account = await Account.findOne({ _id: accountId, user: req.user._id })
        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found or unauthorized"
            })
        }

        const derivedBalance = await deriveBalance(account._id)

        const ledgerEntries = await Ledger.find({ account: accountId })
            .populate("transactionId")
            .sort({ createdAt: -1 })

        return res.status(200).json({
            success: true,
            derivedBalance,
            count: ledgerEntries.length,
            transactions: ledgerEntries.map(entry => ({
                id: entry.transactionId._id,
                type: entry.transactionId.type,
                entryType: entry.entryType,
                amount: entry.amount,
                description: entry.transactionId.description,
                status: entry.transactionId.status,
                date: entry.createdAt
            }))
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch transactions",
            error: error.message
        })
    }
}

module.exports = { createTransaction, completeTransaction, getTransactions }
