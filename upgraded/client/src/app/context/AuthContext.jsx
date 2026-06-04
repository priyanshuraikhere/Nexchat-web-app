"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../lib/api";

const AuthContext =
  createContext();

export const AuthProvider = ({
  children,
}) => {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadUser =
      async () => {
        try {
          const token =
            localStorage.getItem(
              "token"
            );

          if (!token) {
            setLoading(false);
            return;
          }

          const res =
            await api.get(
              "/auth/me"
            );

          setUser(res.data);
        } catch (error) {
          localStorage.removeItem(
            "token"
          );
        } finally {
          setLoading(false);
        }
      };

    loadUser();
  }, []);

  const logout = () => {
    localStorage.removeItem(
      "token"
    );

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () =>
  useContext(AuthContext);