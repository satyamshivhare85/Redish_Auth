// src/VerifyOtp.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { AppData } from "../context/UserContext";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [btnloading, setBtnloading] = useState(false);

  const navigate = useNavigate();
  const { serverUrl } = useAuth();
  const {setIsAuth,setUser}=AppData()

  const handleVerify = async (e) => {
    e.preventDefault();
    setBtnloading(true);

    const email = localStorage.getItem("email");

    try {
      const { data } = await axios.post(
        `${serverUrl}/api/auth/verifyotp`,
        { email, otp },
        { withCredentials: true }
      );

      toast.success(data.message);
      setIsAuth(true);
      setUser(data.user)

      // remove only email
      localStorage.removeItem("email");

      // move to home or login
      navigate("/");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Verification failed");
    } finally {
      setBtnloading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-96">
        <h2 className="text-2xl font-bold text-center mb-6">Verify OTP</h2>

        <form onSubmit={handleVerify}>
          <input
            type="text"
            id="otp"
            maxLength={6}
            placeholder="Enter 6 digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4 outline-none focus:ring-2 focus:ring-green-500"
            required
          />

          <button
            type="submit"
            disabled={btnloading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {btnloading ? "Verifying..." : "Verify"}
          </button>
        </form>

        {/* Extra Links */}
        <div className="mt-5 text-center space-y-2">
          <p>
            Back to{" "}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Login
            </Link>
          </p>

          <p>
            Go to{" "}
            <Link to="/" className="text-green-600 font-semibold hover:underline">
              Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
