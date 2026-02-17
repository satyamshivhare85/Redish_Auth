import crypto from "crypto";
import {redisClient} from "../index.js";


//ek token bnayege use header me bhejenge jisse hmare koi cookie na pd paye
// and set in it cookie csrf header me kisi ne bheja to hm use vhi rok denge
export const generateCSRFToken=async(userId,res)=>{
    const csrfToken=crypto.randomBytes(32).toString("hex")


    const csrfKey=`csrf:${userId}`;

    await redisClient.setEx(csrfKey,3600,csrfToken)

//cookie me set kiya token
    res.cookie("csrfToken",csrfToken,{
        httpOnly:false,
        secure:false,
        sameSite:"lax",
        maxAge:60*60*1000
    })

    return csrfToken;

}

//verify csrf token now-->kind of middleware csrf get me nhi dekhte -->post,put me dekhte hai


export const verifyCSRFToken=async(req,res,next)=>{
    try{
if(req.method=="GET"){
    return next();  //method Get pe check hi nhi krna kuch
}
const userId=req.user?._id;

if(!userId){
    return res.status(401).json(
        {
            message:"user os not authenticated"
        }
    )
}


//steps to get csrf token from frontend

const clientTOken=
req.headers["x-csrf-token"]|| //hm isko use krenge bs
req.headers["x-xsrf-token"]||
req.headers["csrf-token"];


if(!clientTOken){
    return res.status(403).json({//403 yad rkhna 
        message:"CSRF Token missing.please refresh the page",
        code:"CSRF_TOKEN_MISSING",
    })
}

const csrfKey=`csrf:${userId}`;
//check redish se aur is key ko match hai ki nhi

const StoredToken=await redisClient.get(csrfKey);

if(!StoredToken){
    return res.status(403).json({
        message:"CSRF Token Expired.please Try again",
        code:"CSRF_TOKEN_EXPIRED",
    })
}

if(StoredToken!=clientTOken){
      return res.status(403).json({
        message:"CSRF Token is not Valid refresh the page",
        code:"CSRF_TOKEN_VALUE_WRONG",
})
}
next()
    }
    catch(error){
console.log("CSRF VERIFICATION ERROR",error)

return res.status(500).json({
    message:"CSRF verification failed",
    code:"CSRF_VERIFICATION_ERROR"
})
    }
};

//delete csrf token from redis

export const revokeCSRFTOKEN=async (userId)=>{
    const csrfKey=`csrf:${userId}`;

    await redisClient.del(csrfKey)
}

//refresh csrf token

export const refreshCSRFTOKEN=async(userId,res)=>{
    await revokeCSRFTOKEN(userId);//purana htao
    return await generateCSRFToken(userId,res)
}