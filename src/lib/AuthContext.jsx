// ============================================================
// NUBA INCIDENCIAS — Auth Context
// ============================================================
import { createContext, useContext, useState, useEffect } from "react";
import { USUARIOS } from "../data/data";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("nuba-user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = (email, password, recordar) => {
    const u = USUARIOS[email.toLowerCase().trim()];
    if (!u || u.password !== password) return false;
    const userData = { email, nombre: u.nombre, rol: u.rol };
    setUser(userData);
    if (recordar) localStorage.setItem("nuba-user", JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("nuba-user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, esAdmin: user?.rol === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
