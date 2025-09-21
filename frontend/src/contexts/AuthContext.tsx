"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { User, AuthResponse, LoginError } from "@/types";
import { api } from "@/api";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";

interface AuthContextType {
  user: User | null;
  token: string | null;
  authReady: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    display_name?: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (savedUser) setUser(JSON.parse(savedUser));

    if (savedToken) {
      const payload = JSON.parse(atob(savedToken.split(".")[1]));
      const isExpired = payload.exp * 1000 < Date.now();

      if (!isExpired) {
        setToken(savedToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
      } else {
        setToken(null);
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setAuthReady(true);

    // Refresh user from server
    (async () => {
      if (!token) return;
      try {
        const user_me = await api.get("/auth/me");
        setUser(user_me.data);
        localStorage.setItem("user", JSON.stringify(user_me.data));
      } catch (err) {
        if (err instanceof AxiosError && err.response?.status === 401) {
          setToken(null);
          setUser(null);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      }
    })();
  }, [token]);

  const handleAuthResponse = (response: AuthResponse) => {
    setUser(response.user);
    setToken(response.access_token);
    localStorage.setItem("user", JSON.stringify(response.user));
    localStorage.setItem("token", response.access_token);
    api.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${response.access_token}`;
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post<AuthResponse>("/auth/login", {
        username,
        password,
      });
      handleAuthResponse(response.data);
    } catch (error: unknown) {
      console.error("Login failed:", error);
      if (error && typeof error === "object" && "response" in error) {
        const err = error as {
          response: { status: number; data: { detail: string } };
        };
        throw {
          status: err.response.status,
          detail: err.response.data.detail,
        } as LoginError;
      }
      throw error;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    display_name?: string
  ) => {
    try {
      const response = await api.post<AuthResponse>("/auth/register", {
        username,
        email,
        password,
        display_name: display_name || username,
      });
      handleAuthResponse(response.data);
    } catch (error) {
      console.error("Registration failed:", error);
      if (error && typeof error === "object" && "response" in error) {
        const err = error as {
          response: { status: number; data: { detail: string } };
        };
        throw {
          status: err.response.status,
          detail: err.response.data.detail,
        } as LoginError;
      }
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, authReady, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
