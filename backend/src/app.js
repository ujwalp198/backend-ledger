const express=require("express")
const path = require("path")
const cookieParser=require("cookie-parser")
const rateLimit = require("express-rate-limit")
const cors = require("cors")
const { swaggerUi, specs } = require("./swagger")

const authRoutes=require("./routes/authRoutes")
const accountRoutes=require("./routes/accountRoutes")
const transactionRoutes=require("./routes/transactionRoutes")

const app=express()

app.use(cors())

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

app.use(express.json())
app.use(express.static(path.join(__dirname, "../public")))
app.use(cookieParser())

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use("/auth", authRoutes)
app.use("/accounts", accountRoutes)
app.use("/transactions", transactionRoutes)

module.exports=app