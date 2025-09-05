import { createContext, useContext, useState, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { api } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, display_name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  const handleAuthResponse = (response: AuthResponse) => {
    setUser(response.user);
    setToken(response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('token', response.access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`;
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', { username, password });
      handleAuthResponse(response.data);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string, display_name?: string) => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', { 
        username, 
        email, 
        password,
        display_name: display_name || username
      });
      handleAuthResponse(response.data);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}