import { redisClient } from "../index.js";
import TryCatch from "../middlewares/TryCatch.js"
import User from "../models/user.model.js"


export const myprofile = TryCatch(async (req, res) => {
    const user = req.user;
    const sessionId = req.sessionId;

    const sessionData = await redisClient.get(`session:${sessionId}`);

    let sessionInfo = null;

    if (sessionData) {
        const parsedSession = JSON.parse(sessionData);

        sessionInfo = {
            sessionId,
            loginTime: parsedSession.createdAt,
            lastActivity: parsedSession.lastActivity,
        };
    }

    return res.json({ user, sessionInfo });
});


export const adminController=TryCatch(async(req,res)=>{
    
    res.json({
        message:"Hello admin",
    })
})