if (!globalThis.crypto) {
    globalThis.crypto = require("crypto")
}
require("dotenv").config()

const app=  require("./src/app")
const connectToDB= require("./src/config/db")

connectToDB()

app.listen(3000, ()=>
{
    console.log("APP IS RUNNING at http://localhost:3000");
})