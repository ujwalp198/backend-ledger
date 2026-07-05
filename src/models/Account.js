const mongoose = require("mongoose")

const accountSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        accountName: {
            type: String,
            required: true,
            trim: true,
            default: "Main Account"
        },
        balance: {
            type: Number,
            default: 0,
            min: 0
        },
        currency: {
            type: String,
            default: "USD",
            uppercase: true,
            trim: true
        },
        status: {
            type: String,
            enum: ["ACTIVE", "FROZEN", "CLOSED"],
            default: "ACTIVE"
        }
    },
    { timestamps: true }
)

accountSchema.index({ user: 1, accountName: 1 }, { unique: true })

module.exports = mongoose.model("Account", accountSchema)
