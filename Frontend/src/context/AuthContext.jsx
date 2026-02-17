import { createContext, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const serverUrl = "http://localhost:8000";   // change in production

  return (
    <AuthContext.Provider value={{ serverUrl }}>
      {children}
    </AuthContext.Provider>
  );
};

// custom hook (easy access)
export const useAuth = () => useContext(AuthContext);
