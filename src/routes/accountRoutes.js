const express = require("express")
const authenticate = require("../middleware/authMiddleware")
const { getAccounts, createAccount, getBalance } = require("../controllers/accountController")

const router = express.Router()

router.use(authenticate)

router.get("/", getAccounts)
router.post("/", createAccount)
router.get("/:accountId/balance", getBalance)

module.exports = router
