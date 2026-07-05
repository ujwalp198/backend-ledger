const express = require("express")
const authenticate = require("../middleware/authMiddleware")
const idempotencyMiddleware = require("../middleware/idempotencyMiddleware")
const accountStatusMiddleware = require("../middleware/accountStatusMiddleware")
const { createTransaction, completeTransaction, getTransactions } = require("../controllers/transactionController")

const router = express.Router()

router.use(authenticate)

router.post("/", idempotencyMiddleware, accountStatusMiddleware, createTransaction)
router.post("/:transactionId/complete", completeTransaction)
router.get("/:accountId", getTransactions)

module.exports = router
