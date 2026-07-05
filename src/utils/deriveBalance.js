const mongoose = require("mongoose")
const Ledger = require("../models/Ledger")

async function deriveBalance(accountId) {
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

    return result.length > 0 ? result[0].balance : 0
}

module.exports = deriveBalance
