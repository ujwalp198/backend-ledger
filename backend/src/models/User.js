const mongoose = require("mongoose")
const { EMAIL_REGEX } = require("../utils/emailValidator")

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [EMAIL_REGEX, "Invalid email format"]
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false
        },
        role: {
            type: String,
            enum: ["USER", "ADMIN"],
            default: "USER"
        }
    },
    { timestamps: true }
)

module.exports = mongoose.model("User", userSchema)
