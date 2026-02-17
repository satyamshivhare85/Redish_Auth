// import jwt from "jsonwebtoken";
// import { redisClient } from "../index.js";
// import User from "../models/user.model.js";
// import { isSessionActive } from "../config/token.js";

// const isAuth = async (req, res, next) => {
//   try {
//     const token = req.cookies?.accessToken;
//     // console.log(token)
//     // console.log(req.cookies.accessToken)
//     if (!token) {
//       return res.status(403).json({
//         message: "Access denied. Login required. please login-no token",
//       });
//     }

//     // 2. Verify Token (Fixed typo from IWT to JWT)
//     // Note: If expired, this will jump straight to the catch block
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);


//    //kya sessuib hai active ki nhi

//    const sessionActive= await isSessionActive(decoded.id,decoded.sessionId)
//    if(!sessionActive){
//        res.clearCookie("refreshToken")
//     res.clearCookie("accessToken")
//     res.clearCookie("csrfToken")

//     return res.status(401).json({
//       message:"session Expired.You have been logged in from another device"
//     })
//    }


//     // 3. Try to get user from Redis (Standardized key with :)
//     const cacheKey = `user:${decoded.id}`;
//     const cacheUser = await redisClient.get(cacheKey);

//     if (cacheUser) {
//       req.user = JSON.parse(cacheUser);
//       req.sessionId=decoded.sessionId;
//       return next();
//     }

//     // 4. If not in cache, find in MongoDB
//     const user = await User.findById(decoded.id).select("-password");

//     if (!user) {
//       return res.status(404).json({ message: "No user found with this id" });
//     }

//     // 5. Store in Redis for 1 hour (Fixed typo from user_ to user)
//     await redisClient.setEx(cacheKey, 3600, JSON.stringify(user));

//     req.user = user;
//       req.sessionId=decoded.sessionId;

//     next();
    
//   } catch (error) {
//     // Check if error is due to token expiration
//     if (error.name === "TokenExpiredError") {
//       return res.status(401).json({ message: "Token expired, please refresh" });
//     }
    
//     return res.status(500).json({
//       success: false,
//       message: "Internal Authentication Error",
//       error: error.message
//     });
//   }
// };

// export default isAuth;



// export const authorizedAdmin = async (req,res,next)=>{
//   const user = req.user;

//   if(!user){
//     return res.status(401).json({
//       message:"Not authenticated"
//     })
//   }

//   if(user.role !== "admin"){
//     return res.status(403).json({
//       message:"You are not allowed for this activity"
//     })
//   }

//   next(); // 👈 YE MOST IMPORTANT HAI
// }


import jwt from "jsonwebtoken";
import { redisClient } from "../index.js";
import User from "../models/user.model.js";
import { isSessionActive } from "../config/token.js";

const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        message: "Access denied. Login required.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if session is active
    const sessionActive = await isSessionActive(
      decoded.id,
      decoded.sessionId
    );

    if (!sessionActive) {
      res.clearCookie("refreshToken");
      res.clearCookie("accessToken");
      res.clearCookie("csrfToken");

      return res.status(401).json({
        message:
          "Session expired. You have been logged in from another device.",
      });
    }

    const cacheKey = `user:${decoded.id}`;
    const cacheUser = await redisClient.get(cacheKey);

    if (cacheUser) {
      req.user = JSON.parse(cacheUser);
      req.sessionId = decoded.sessionId;
      return next();
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Store lean object in Redis
    await redisClient.setEx(
      cacheKey,
      3600,
      JSON.stringify(user.toObject())
    );

    req.user = user;
    req.sessionId = decoded.sessionId;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.clearCookie("accessToken");
      return res.status(401).json({
        message: "Access token expired. Please refresh.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

export default isAuth;

// ===================================
// ADMIN AUTHORIZATION
// ===================================

// export const authorizedAdmin = (req, res, next) => {
//   if (!req.user) {
//     return res.status(401).json({
//       message: "Not authenticated",
//     });
//   }

//   if (req.user.role !== "admin") {
//     return res.status(403).json({
//       message: "You are not allowed to perform this action",
//     });
//   }

//   next();
// };



export const authorizedAdmin = async (req,res,next)=>{
  const user = req.user;

  if(!user){
    return res.status(401).json({
      message:"Not authenticated"
    })
  }

  if(user.role !== "admin"){
    return res.status(403).json({
      message:"You are not allowed for this activity"
    })
  }

  next(); // 👈 YE MOST IMPORTANT HAI
}
