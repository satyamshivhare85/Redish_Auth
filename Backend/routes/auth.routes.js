import  express from "express"
import { loginUser, logoutUser, refreshCSRF, refreshToken, registerUser, verifyotp, verifyUser } from "../controllers/auth.controller.js";
import isAuth from "../middlewares/isAuth.js";
import { verifyCSRFToken } from "../middlewares/csrfMiddleware.js";


const authRouter=express.Router();

authRouter.post('/register',registerUser)
authRouter.post('/verify/:token',verifyUser)
authRouter.post('/login',loginUser)
authRouter.post('/verifyotp',verifyotp)
authRouter.post('/refresh',refreshToken)
authRouter.post('/logout',isAuth,verifyCSRFToken,logoutUser)
authRouter.post('/refresh-csrf',isAuth,refreshCSRF)
//csrf middleware jha hm post patch de rhe ho jaise post krna hai ..etc login me to yar cookie me jata hi hai access token or refresh token to koi jrurt nhi vha

export default authRouter;