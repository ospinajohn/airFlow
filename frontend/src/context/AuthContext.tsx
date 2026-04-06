import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/client";

export interface UserSettings {
  autoStartPomodoro: boolean;
  pomodoroWorkDuration: number;
  pomodoroShortBreakDuration: number;
  pomodoroLongBreakDuration: number;
  pomodoroCyclesUntilLongBreak: number;
  pomodoroAutoStartBreaks: boolean;
  showKanbanHealthCheck: boolean;
  weekStartsOn: number;
  vibrationEnabled: boolean;
  theme: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  settings: UserSettings | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar configuraciones desde el API
  const fetchSettings = async () => {
    try {
      const response = await apiClient.get("/settings");
      setSettings(response.data);
    } catch (error) {
      console.error("Error al cargar configuraciones:", error);
    }
  };

  useEffect(() => {
    // 🔍 Recuperar sesión persistente
    const savedUser = localStorage.getItem("airflow_user");
    const savedToken = localStorage.getItem("airflow_token");

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
      fetchSettings();
    }
    setLoading(false);
  }, []);

  const login = (userData: User, newToken: string) => {
    setUser(userData);
    setToken(newToken);
    localStorage.setItem("airflow_user", JSON.stringify(userData));
    localStorage.setItem("airflow_token", newToken);
    fetchSettings();
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSettings(null);
    localStorage.removeItem("airflow_user");
    localStorage.removeItem("airflow_token");
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const response = await apiClient.patch("/settings", newSettings);
      setSettings(response.data);
    } catch (error) {
      console.error("Error al actualizar configuraciones:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        settings,
        login,
        logout,
        updateSettings,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
