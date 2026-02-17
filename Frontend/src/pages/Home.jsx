import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "./Apiinterceptor";   // adjust path if needed
import { AppData } from "../context/UserContext";
import Dashboard from "./Dashboard";

const Home = () => {
  const navigate = useNavigate();
const {logout,user}=AppData()
  return (
    <div className="flex items-center justify-center min-h-screen">
      <button
        onClick={()=>logout(navigate)}
        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
      >
        Logout
      </button>


{/* only visible to admin */}
       {  user && user.role==="admin" && (
         <Link
         to="/dashboard"
      
        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
      >
      Dashboard
      </Link>
       )

       }
    </div>
  );
};

export default Home;
