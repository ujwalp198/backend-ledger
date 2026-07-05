const express=require("express")
const path = require("path")
const cookieParser=require("cookie-parser")
const authRoutes=require("./routes/authRoutes")
const accountRoutes=require("./routes/accountRoutes")
const transactionRoutes=require("./routes/transactionRoutes")


const app=express()

app.use(express.json())
app.use(express.static(path.join(__dirname, "../public")))
app.use(cookieParser())
app.use("/auth", authRoutes)
app.use("/accounts", accountRoutes)
app.use("/transactions", transactionRoutes)

module.exports=app