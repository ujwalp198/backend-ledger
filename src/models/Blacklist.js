const mongoose = require("mongoose")

const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 604800 // Automatically delete after 7 days (7 * 24 * 60 * 60)
    }
})

module.exports = mongoose.model("Blacklist", blacklistSchema)
