const mongoose = require("mongoose")
const Ledger = require("../models/Ledger")
const redis = require("../config/redis")

async function deriveBalance(accountId) {
    const cacheKey = `balance:${accountId}`
    
    try {
        if (redis && redis.status === "ready") {
            const cachedBalance = await redis.get(cacheKey)
            if (cachedBalance !== null && cachedBalance !== undefined) {
                return parseFloat(cachedBalance)
            }
        }
    } catch (cacheErr) {
        // Fall back to database query if Redis read fails
    }

    const result = await Ledger.aggregate([
        { $match: { account: new mongoose.Types.ObjectId(accountId) } },
        {
            $group: {
                _id: "$account",
                totalCredits: {
                    $sum: {
                        $cond: [{ $eq: ["$entryType", "CREDIT"] }, "$amount", 0]
                    }
                },
                totalDebits: {
                    $sum: {
                        $cond: [{ $eq: ["$entryType", "DEBIT"] }, "$amount", 0]
                    }
                }
            }
        },
        {
            $project: {
                balance: { $subtract: ["$totalCredits", "$totalDebits"] }
            }
        }
    ])

    const balance = result.length > 0 ? result[0].balance : 0
    
    try {
        if (redis && redis.status === "ready") {
            await redis.set(cacheKey, balance, "EX", 3600) // cache for 1 hour
        }
    } catch (setErr) {
        // Ignore cache write error
    }

    return balance
}

async function invalidateBalanceCache(accountId) {
    try {
        if (redis && redis.status === "ready") {
            await redis.del(`balance:${accountId}`)
        }
    } catch (delErr) {
        // Ignore cache invalidation error if Redis is down
    }
}

module.exports = { deriveBalance, invalidateBalanceCache }

