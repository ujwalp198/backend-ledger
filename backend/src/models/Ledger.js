const mongoose = require("mongoose")

const ledgerSchema = new mongoose.Schema(
    {
        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
            required: true
        },
        account: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            required: true
        },
        entryType: {
            type: String,
            enum: ["CREDIT", "DEBIT"],
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01
        }
    },
    { timestamps: true }
)

module.exports = mongoose.model("Ledger", ledgerSchema)
