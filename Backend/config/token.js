// import jwt from "jsonwebtoken"
// // import { id } from "zod/v4/locales"
// import { redisClient } from "../index.js";
// import { generateCSRFToken, refreshCSRFTOKEN, revokeCSRFTOKEN } from "../middlewares/csrfMiddleware.js";
// import { refreshToken } from "../controllers/auth.controller.js";

// import crypto from 'crypto'

// //phle login pe dono bnege ek sth
// export const generateToken=async(id,res)=>{

// const sessionId=crypto.randomBytes(16).toString("hex");

//     const accessToken=jwt.sign({id,sessionId},process.env.JWT_SECRET,{
//         expiresIn:"15m",
//     })

//     const refreshToken=jwt.sign({id,sessionId},process.env.REFRESH_SECRET,{
//         expiresIn:"7d",
//     })
// //assan trika hai seesion bnane ka hai refresh token bnane ka hm refresh token se renew krte rhege hm access token ko
//     const refreshTOkenKey=`refresh_token:${id}`

//     const activeSessionKey=`active_session:${id}`;
//     const sessionDataKey=`session:${sessionId}`;
  
//     const exisitingSession=await redisClient.get(activeSessionKey);
//     if(exisitingSession){
//         await redisClient.del(`session:${exisitingSession}`);//delete existing sessiondata key
//         await redisClient.del(refreshToken) //delete refresh token
//     }


//     const sessionData={
//         userId:id,
//         sessionId,
//         createdAt: new Date().toISOString,
//         lastActivity:new Date().toISOString
//     }


//     await redisClient.setEx(refreshTOkenKey,7*24*60*60,refreshToken);
//     await redisClient.setEx(sessionDataKey,7*24*60*60,
//         JSON.stringify(sessionData)
//     );
    

//     res.cookie("accessToken",accessToken,{
//         httpOnly:true,
//         secure:false,
//         sameSite:"lax",
//         maxAge:15*60*1000,
//     })


//     res.cookie("refreshToken",refreshToken,{
//          httpOnly:true,
//         maxAge:7*24*60*60*1000,
//         // sameSite:"lax",//ye sirf get krne me use kr skte ho post nhi kr skte ho hence hacker  ab  hmare cookie nhi chori kr payenge
//         sameSite:"lax",
//         secure:false
//     })




//     //csrf token generate
//     const csrfToken=await generateCSRFToken(id,res)

// return {accessToken,refreshToken,csrfToken,sessionId}
// };

// //regain acess token by refresh token
// //match refresh token with jo redish me store hai
// //redis me sirf refresh token hi jata hai 

// export const verifyRefreshToken=async(refreshToken)=>{
//     try{
//       const decode=jwt.verify(refreshToken,process.env.REFRESH_SECRET);

//       const storedToken=await redisClient.get(`refresh_token:${decode.id}`)

//     //   if(storedToken==refreshToken){
//     //     return decode;
//     //   }
//     //   return null;
    
//     if(storedToken!== refreshToken){
//         return null;
//     }
    
//     const activeSessionId=await redisClient.get(`active_session:${decode.id}`)

//     if(activeSessionId!=decode.sessionId){ //decode-->user
// return null;
//     }


//     const sessionData=await redisClient.get(`session:${decode.sessionId}`);
//     if(!sessionData) return null;
//     //store session data

//     const parsedSessionData=JSON.parse(sessionData)
//     parsedSessionData.lastActivity=new Date().toISOString()
// //koi login bhi kr le tbbhi hm shi se login rhe... acccess token me br br jata rhege refresh ke sth
//     await redisClient.setEx(`session;${decode.sessionId}`,7*24*60*60,JSON.stringify(parsedSessionData))
//     return decode;
//     }
//     catch(error){
// return null;
//     }
// }


// export const generateAcessToken=(id,sessionId,res)=>{
//     const accessToken= jwt.sign({id,sessionId},process.env.JWT_SECRET,{
//         expiresIn:"15m",
//     })
//      res.cookie("accessToken",accessToken,{
//         httpOnly:true,
//         secure:false,
//         sameSite:"lax",
//         maxAge:15*60*1000,
//     })
// }


// //revoke token jb logout krenge tb use krenge

// export const revokeRefreshToken =async (userId)=>{
//     const activeSessionId=await redisClient.get(`active_session;${userId}`)
//     await redisClient.del(`refresh_token:${userId}`);
//     await redisClient.del(`active_session:${userId}`)

//     if(activeSessionId){
//         await redisClient.del(`session;${activeSessionId}`)
//     }
//     await revokeCSRFTOKEN();//csrftoken bhi h
//     // t jayega
// }




// //check session active

// export const isSessionActive=async (userId,sessionId)=>{
//     const activeSessionId=await redisClient.get(`active_session:${userId}`)
//     return activeSessionId===sessionId;
// }



import jwt from "jsonwebtoken";
import crypto from "crypto";
import { redisClient } from "../index.js";
import { generateCSRFToken, revokeCSRFTOKEN } from "../middlewares/csrfMiddleware.js";

// =====================================================
// GENERATE TOKENS (LOGIN)
// =====================================================

export const generateToken = async (id, res) => {
  const sessionId = crypto.randomBytes(16).toString("hex");

  const accessToken = jwt.sign(
    { id, sessionId },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id, sessionId },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  const refreshTokenKey = `refresh_token:${id}`;
  const activeSessionKey = `active_session:${id}`;
  const sessionDataKey = `session:${sessionId}`;

  // 🔥 If user already logged in, remove old session
  const existingSession = await redisClient.get(activeSessionKey);

  if (existingSession) {
    await redisClient.del(`session:${existingSession}`);
  }

  // Session data
  const sessionData = {
    userId: id,
    sessionId,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };

  // Store in Redis
  await redisClient.setEx(refreshTokenKey, 7 * 24 * 60 * 60, refreshToken);
  await redisClient.setEx(activeSessionKey, 7 * 24 * 60 * 60, sessionId);
  await redisClient.setEx(
    sessionDataKey,
    7 * 24 * 60 * 60,
    JSON.stringify(sessionData)
  );

  // Cookies
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const csrfToken = await generateCSRFToken(id, res);

  return { accessToken, refreshToken, csrfToken, sessionId };
};

// =====================================================
// VERIFY REFRESH TOKEN
// =====================================================

export const verifyRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    const storedToken = await redisClient.get(
      `refresh_token:${decoded.id}`
    );

    if (storedToken !== refreshToken) return null;

    const activeSessionId = await redisClient.get(
      `active_session:${decoded.id}`
    );

    if (activeSessionId !== decoded.sessionId) return null;

    const sessionData = await redisClient.get(
      `session:${decoded.sessionId}`
    );

    if (!sessionData) return null;

    // Update last activity
    const parsedSession = JSON.parse(sessionData);
    parsedSession.lastActivity = new Date().toISOString();

    await redisClient.setEx(
      `session:${decoded.sessionId}`,
      7 * 24 * 60 * 60,
      JSON.stringify(parsedSession)
    );

    return decoded;
  } catch (error) {
    return null;
  }
};

// =====================================================
// GENERATE NEW ACCESS TOKEN (REFRESH)
// =====================================================

export const generateAccessToken = (id, sessionId, res) => {
  const accessToken = jwt.sign(
    { id, sessionId },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });

  return accessToken;
};

// =====================================================
// LOGOUT (REVOKE TOKENS)
// =====================================================

export const revokeRefreshToken = async (userId) => {
  const activeSessionId = await redisClient.get(
    `active_session:${userId}`
  );

  await redisClient.del(`refresh_token:${userId}`);
  await redisClient.del(`active_session:${userId}`);

  if (activeSessionId) {
    await redisClient.del(`session:${activeSessionId}`);
  }

  await revokeCSRFTOKEN(userId);
};

// =====================================================
// CHECK SESSION ACTIVE
// =====================================================

export const isSessionActive = async (userId, sessionId) => {
  const activeSessionId = await redisClient.get(
    `active_session:${userId}`
  );

  return activeSessionId === sessionId;
};
