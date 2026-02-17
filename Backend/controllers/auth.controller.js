import { loginSchema, registerSchema } from "../config/zod.js";
import mongoSanitize from 'express-mongo-sanitize';
import TryCatch from "../middlewares/TryCatch.js";
import { redisClient } from "../index.js";
import User from"../models/user.model.js"
import crypto from "crypto"
import sendMail from "../config/sendMail.js";
import bcrypt from "bcrypt"
import { getOtpHtml, getVerifyEmailHtml } from "../config/html.js";
// import { generateAcessToken, generateToken, revokeRefreshToken, verifyRefreshToken } from "../config/token.js";
import { generateAccessToken, generateToken, revokeRefreshToken, verifyRefreshToken } from "../config/token.js";

import { generateCSRFToken } from "../middlewares/csrfMiddleware.js";


export const registerUser = TryCatch(async (req, res) => {
    // 1. Sanitize with a fallback to an empty object {}
    // This prevents the "received undefined" error if the body is missing
    const sanitizedBody = mongoSanitize.sanitize(req.body || {}); 

    // 2. Validate with Zod
    const validation = registerSchema.safeParse(sanitizedBody);

    if (!validation.success) {
        const ZodError = validation.error; 

        let firstErrorMessage = "Validation Failed";
        let allErrors = [];

        // FIXED: Check for ZodError.issues (plural)
        if (ZodError?.issues && Array.isArray(ZodError.issues)) {
            allErrors = ZodError.issues.map((issue) => ({
                field: issue.path ? issue.path.join('.') : "unknown",
                message: issue.message || 'Validation Error',
                code: issue.code,
            }));

            // Pick the very first clean message
            firstErrorMessage = allErrors[0]?.message || "Validation Error";
        }

        return res.status(400).json({ 
            message: firstErrorMessage,
            errors: allErrors 
        });
    }
    
    // 3. Destructure clean data from validation.data
    const { name, email, password } = validation.data;


    //4 rate limit
//same email se ya ip adress se koi spam kr to nhi rha
    const rateLimitKey=`register-rate-limit:${req.ip}:${email}`;
if(await redisClient.get(rateLimitKey)){
    return res.status(429).json({
        message:"Too many requests,try again later",
    })
}

const existingUser = await User.findOne({email})

if(existingUser){
    return res.status(400).json({
        message: "user already exists"})
}

const hashPassword=await bcrypt.hash(password,10);

const verifyToken=crypto.randomBytes(32).toString("hex");


const  verifyKey=`verify:${verifyToken}`

const datatoStore=JSON.stringify({
    name,
    email,
    password:hashPassword
})

//store for 5 min in redish

await redisClient.set(verifyKey,datatoStore,{EX:300})

//now for email
const subject="verify your email for Account creation"
const html=getVerifyEmailHtml({email,token:verifyToken});

await sendMail({email,subject,html})

//set rate limit

await redisClient.set(rateLimitKey,"true",{EX:60})
    res.json({
        message:"if your email is valid ,a verification link has been sent  it will  expire in a minute"
    });
});

//jo http;localhost;/api/vi/verify ke bd frr jo token jata hai vo verification hota hai
//ye request frontend se bhejenge usme se params lelenge 


export const verifyUser = TryCatch(async (req, res) => {
    const { token } = req.params;

    if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
    }

    const verifyKey = `verify:${token}`;
    const userDataRaw = await redisClient.get(verifyKey);

    if (!userDataRaw) {
        return res.status(400).json({ message: "Verification link is expired" });
    }

    // 🔥 FIX 1: Redis se string milti hai, use Object mein badlo
    const userData = JSON.parse(userDataRaw);

    // 🔥 FIX 2: existingUser check ke liye userData.email use karo
    const existingUser = await User.findOne({ email: userData.email });

    if (existingUser) {
        await redisClient.del(verifyKey); // Token ab kisi kaam ka nahi
        return res.status(400).json({ message: "User already exists" });
    }

    // 3. Create new user
    const newUser = await User.create({
        name: userData.name,
        email: userData.email,
        password: userData.password // Ye pehle se hashed hai (registerUser mein kiya tha)
    });

    // 4. Token delete karo register hone ke baad
    await redisClient.del(verifyKey);

    res.status(201).json({
        message: "Email verified successfully! Your account has been created",
        user: { 
            _id: newUser._id, 
            name: newUser.name, 
            email: newUser.email 
        } // Password response mein mat bhejo, security risk hai!
    });
});



// ab DB me chije aa chuki hai..

// __________LOG IN______________________________________

//otp-->redish(store for 5 min)-->email
export const loginUser=TryCatch(async(req,res)=>{
     //zod Validation and sanitize
       const sanitizedBody = mongoSanitize.sanitize(req.body || {}); 
    // 2. Validate with Zod
    const validation = loginSchema.safeParse(sanitizedBody);
    if (!validation.success) {
        const ZodError = validation.error; 
        let firstErrorMessage = "Validation Failed";
        let allErrors = [];
        // FIXED: Check for ZodError.issues (plural)
        if (ZodError?.issues && Array.isArray(ZodError.issues)) {
            allErrors = ZodError.issues.map((issue) => ({
                field: issue.path ? issue.path.join('.') : "unknown",
                message: issue.message || 'Validation Error',
                code: issue.code,
            }));
            // Pick the very first clean message
            firstErrorMessage = allErrors[0]?.message || "Validation Error";
        }
        return res.status(400).json({ 
            message: firstErrorMessage,
            errors: allErrors 
        });
    }
    // 3. Destructure clean data from validation.data
    const {  email, password } = validation.data;

//ab frr se limit key bnao ab otp ke liye
const rateLimitKey=`login-rate-limit:${req.ip}:${email}`;
if(await redisClient.get(rateLimitKey)){
    return res.status(429).json({
        message:"Too many requests,try again later",
    })
}

const user=await User.findOne({email})

if(!user){
    return res.status(400).json({message:"please signup or invalid credentials"})
}
const comparePassword = await bcrypt.compare(password,user.password);

if(!comparePassword){
    return res.status(400).json({message:"invalid credentials"})
}

const otp= Math.floor(100000+Math.random()*900000).toString();

const otpKey=`otp${email}`;

await redisClient.set(otpKey,JSON.stringify(otp),{
    EX:300 //redis me store 5 min ke liye
});

const subject="otp for Verification"

const html= getOtpHtml({email,otp})

await sendMail({email,subject,html});

await redisClient.set(rateLimitKey,"true",{
    EX:60,//otp valid for ek second
})

res.status(200).json({
     success: true, //success bhejo because toastifier success hi leta hai
    message:
    "if your email is Valid,an otp has been sent ,it will be valid for 5 min"
})

})

//const verify otp

export const verifyotp=TryCatch(async(req,res)=>{
    //email or otp local storage me save kr lenge vha se utha lenge

    const{email,otp}=req.body;

    if(!email||!otp){
     return res.status(400).json({message:"please provide all details"})  
    }

    const otpKey=`otp${email}`; //Redis ke liye ek Unique Key bana rahe ho. 
//user ka OTP uske email ke saath "map" ho jaye taaki data mix na ho.
    const storedOtpString=await redisClient.get(otpKey);

    if(!storedOtpString){
        return res.status(400).json({message:"otp is expired"})
    }
// now get storedOtp by parsing

const storedOtp=JSON.parse(storedOtpString)

if(storedOtp!==otp){//user or storedotp not match
return res.status(400).json({message:"otp is not valid"})
}


//now all success it means delete otp from redish

await redisClient.del(otpKey)

let user=await User.findOne({email});


//now generate token-->access and refresh token

const tokenData = await generateToken(user._id,res);

res.status(200).json({
    message:`welcome ${user.name}`,
    user,
    sessionInfo:{
        sessionId: tokenData.sessionId,
        loginTime: tokenData.createdAt,
        csrfToken: tokenData.csrfToken
    }
});


})



//regain access token

export const refreshToken= TryCatch(async(req,res)=>{
    const refreshToken=req.cookies.refreshToken;

    if(!refreshToken){
        return res.status(401).json({message:"Invalid refresh token"})
    }


    //now take decode data by verifying refreshtoken callling verifyRefreshToken
    const decode=await verifyRefreshToken(refreshToken)

    if(!decode){
          res.clearCookie("refreshToken")
    res.clearCookie("accessToken")
    res.clearCookie("csrfToken")
        return res.status(401).json({
            message:" session expired please login"
        })
    }
generateAcessToken(decode.id,decode.sessionId,res);

res.status(200).json({
    message:"access token has regenrated/refreshed"
})

})


export const logoutUser = TryCatch(async (req,res)=>{
    const userId=req.user._id;
    await revokeRefreshToken(userId);

    res.clearCookie("refreshToken")
    res.clearCookie("accessToken")
    res.clearCookie("csrfToken")

    await redisClient.del(`user${userId}`)
    res.status(200).json({message:"logout successfully"})
}) 



//make end point for refresh csrf

export const refreshCSRF= TryCatch(async(req,res)=>{
    const userId=req.user._id;

    const newCSRFToken=await generateCSRFToken(userId,res);

    res.json({
        message:"CSRF token refreshed",
        csrfToken:newCSRFToken,
    })
})