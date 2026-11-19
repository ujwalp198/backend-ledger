const express = require("express")
const validateEmail = require("../middleware/validateEmail")
const validatePassword = require("../middleware/validatePassword")
const validateLogin = require("../middleware/validateLogin")
const authenticate = require("../middleware/authMiddleware")
const { register, login, getMe, logout } = require("../controllers/authController")

const router = express.Router()

router.post("/register", validateEmail, validatePassword, register)
router.post("/login", validateLogin, login)
router.get("/me", authenticate, getMe)
router.post("/logout", authenticate, logout)

module.exports = router
