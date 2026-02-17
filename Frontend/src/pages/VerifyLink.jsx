// // src/pages/Verify.jsx
// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axios from "axios";
// import Cookies from "js-cookie";
// import { useAuth } from "../context/AuthContext";

// const Verify = () => {
//   const { token } = useParams();
//   const { serverUrl } = useAuth();
//   const navigate = useNavigate();

//   const [successMessage, setSuccessMessage] = useState("");
//   const [errorMessage, setErrorMessage] = useState("");
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     verifyUser();
//   }, []);

//   const verifyUser = async () => {
//     try {
//       const csrfToken = Cookies.get("csrfToken");

//       const { data } = await axios.post(
//         `${serverUrl}/api/auth/verify/${token}`,
//         {},
//         {
//           withCredentials: true,
//           headers: {
//             "x-csrf-token": csrfToken,
//           },
//         }
//       );

//       if (data.success) {
//         setSuccessMessage(data.message || "Account verified successfully");

//         // after 2 sec redirect to login
//         setTimeout(() => {
//           navigate("/login");
//         }, 2000);
//       } else {
//         setErrorMessage(data.message || "Verification failed");
//       }
//     } catch (error) {
//       setErrorMessage(
//         error.response?.data?.message || "Something went wrong"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-50">
//       <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md">
//         <h2 className="text-2xl font-bold mb-4">Email Verification</h2>

//         {loading && <p className="text-blue-500">Verifying...</p>}

//         {successMessage && (
//           <p className="text-green-600 font-semibold">{successMessage}</p>
//         )}

//         {errorMessage && (
//           <p className="text-red-600 font-semibold">{errorMessage}</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Verify;

// src/pages/Verify.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { useAuth } from "../context/AuthContext";

const Verify = () => {
  const { token } = useParams();
  const { serverUrl } = useAuth();
  const navigate = useNavigate();

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyUser();
  }, []);

  const verifyUser = async () => {
    try {
      const csrfToken = Cookies.get("csrfToken");

      const { data } = await axios.post(
        `${serverUrl}/api/auth/verify/${token}`,
        {},
        {
          withCredentials: true,
          headers: {
            "x-csrf-token": csrfToken,
          },
        }
      );

      if (data.success) {
        setSuccessMessage(data.message || "Account verified successfully");

        // 1 second later redirect to home page
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        setErrorMessage(data.message || "Verification failed");
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md">
        <h2 className="text-2xl font-bold mb-4">Email Verification</h2>

        {loading && <p className="text-blue-500">Verifying...</p>}

        {successMessage && (
          <p
            onClick={() => navigate("/")}
            className="text-green-600 font-semibold cursor-pointer hover:text-green-800 transition duration-300"
          >
            {successMessage} (Redirecting...)
          </p>
        )}

        {errorMessage && (
          <p className="text-red-600 font-semibold">{errorMessage}</p>
        )}
      </div>
    </div>
  );
};

export default Verify;
