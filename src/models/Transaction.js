const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        account: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            required: true
        },
        toAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account"
        },
        type: {
            type: String,
            enum: ["DEPOSIT", "WITHDRAWAL", "TRANSFER"],
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01
        },
        description: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: ["PENDING", "COMPLETED", "FAILED"],
            default: "PENDING"
        },
        idempotencyKey: {
            type: String,
            sparse: true,
            unique: true
        }
    },
    { timestamps: true }
)

module.exports = mongoose.model("Transaction", transactionSchema)
