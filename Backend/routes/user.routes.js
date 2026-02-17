import express from "express"
import { adminController, myprofile } from "../controllers/user.controllers.js";
import isAuth, { authorizedAdmin } from "../middlewares/isAuth.js";

const userRouter=express.Router();

userRouter.get('/profile',isAuth,myprofile);
userRouter.get('/admin',isAuth,authorizedAdmin,adminController)

export default userRouter;