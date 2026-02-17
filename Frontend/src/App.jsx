import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./pages/register";
import Login from "./pages/login";
import VerifyOtp from "./pages/VerifyOtp";
import Loading from "./pages/Loading";

import { ToastContainer } from "react-toastify";
import { AppData } from "./context/UserContext";
import Verify from "./pages/VerifyLink.jsx";
import Dashboard from "./pages/Dashboard.jsx";

const App = () => {
  const { isAuth, loading } = AppData();

  if (loading) return <Loading />;

  return (
    <>
      <Router>
        <Routes>
          {/* Private */}
          <Route
            path="/"
            element={isAuth ? <Home /> : <Navigate to="/login" replace />}
          />

          {/* Public */}
          <Route
            path="/login"
            element={!isAuth ? <Login /> : <Navigate to="/" replace />}
          />

          <Route
            path="/register"
            element={!isAuth ? <Register /> : <Navigate to="/" replace />}
          />
                 <Route
                  path="/token/:token"
                  element={!isAuth ? <Verify /> : <Navigate to="/" replace />} />

          {/* OTP → also public */}
          <Route
            path="/verifyOtp"
            element={!isAuth ? <VerifyOtp /> : <Navigate to="/" replace />}
          />

          <Route
          path="/dashboard"
        element={isAuth ? <Dashboard /> : <Navigate to="/" replace />}
  />

        </Routes>
      </Router>

      <ToastContainer />
    </>
  );
};

export default App;
