import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import { createClient } from "redis";
import userRouter from "./routes/user.routes.js";
import cors from "cors"
dotenv.config();
const app=express();

//middlewares
app.use(express.json())
app.use(cookieParser());
await connectDB();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.error("❌ Missing REDIS_URL in environment variables");
    process.exit(1);
}

export const redisClient = createClient({
    url: redisUrl,
});

// FIXED: Pass the function reference, don't execute it inside catch
redisClient.on('error', (err) => console.error('Redis Client Error', err));

redisClient.connect()
    .then(() => console.log("✅ Connected to Redis successfully"))
    .catch((err) => {
        console.error("❌ Redis connection failed:", err);
    });



const PORT = process.env.PORT || 5000; 
app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true,//(with...cookies ya jo access tokem refresh tokem frontend se tie up ho jaye)
    methods:["GET","POST","DELETE","OPTIONS"]
}))

app.get('/', (req, res) => {
  res.send("Checking server");
});

//routes
app.use('/api/auth',authRouter)
app.use('/api/user',userRouter)

app.listen(PORT, () => {
  
  console.log(`Server running on ${PORT}`);
});






