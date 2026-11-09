"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/lib/types";
import { apiFetch, setAuthToken, removeAuthToken, getAuthToken } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  activeDepartment: string;
  setActiveDepartment: (dept: string) => void;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, departmentContext?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeDepartment, setActiveDeptState] = useState<string>("Admin");
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check saved token and user on client mount
    const savedToken = getAuthToken();
    const savedUser = localStorage.getItem("techno_user");
    const savedDept = localStorage.getItem("techno_active_dept");

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setToken(savedToken);
        if (savedDept) {
          setActiveDeptState(savedDept);
        } else {
          setActiveDeptState(parsedUser.department || "Admin");
        }
      } catch (e) {
        removeAuthToken();
      }
    }
    setIsLoading(false);
  }, []);

  const setActiveDepartment = (dept: string) => {
    setActiveDeptState(dept);
    localStorage.setItem("techno_active_dept", dept);
  };

  const login = async (email: string, password: string, departmentContext?: string) => {
    setIsLoading(true);
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          department_context: departmentContext,
        }),
      });

      const { access_token, user: loggedUser } = data;
      setToken(access_token);
      setUser(loggedUser);
      setAuthToken(access_token);
      localStorage.setItem("techno_user", JSON.stringify(loggedUser));

      const chosenDept = departmentContext || loggedUser.department || "Admin";
      setActiveDeptState(chosenDept);
      localStorage.setItem("techno_active_dept", chosenDept);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setActiveDeptState("Admin");
    removeAuthToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeDepartment,
        setActiveDepartment,
        token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

