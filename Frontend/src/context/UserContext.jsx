// context/UserContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../pages/Apiinterceptor";
import { toast } from "react-toastify";


const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  async function fetchUser() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/user/profile");

      setUser(data.user);
      setIsAuth(true);
    } catch (error) {
         // 🔥 IMPORTANT FIX
    if (error.response?.status === 401 || error.response?.status === 403) {
      setUser(null); // don't crash app
    }
     else console.log(error);
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  }


  
  async function logout(navigate) {
    try {
     const{data}= await api.post("/api/auth/logout");
      setIsAuth(false);
      setUser(null);
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {

      toast.error("Logout failed");
    }
  };
  // useEffect(() => {
  //   fetchUser();
  // }, []);
  useEffect(() => {
  const checkAuth = async () => {
    try {
      await fetchUser();
    } catch (err) {
      setUser(null);
      setIsAuth(false)
    }
  };

  checkAuth();
}, []);


  return (
    <AppContext.Provider value={{ setIsAuth, isAuth, setUser, user, loading,logout }}>
      {children}
    </AppContext.Provider>
  );
};

export const AppData = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppData must be used within AppProvider");
  return context;
};
