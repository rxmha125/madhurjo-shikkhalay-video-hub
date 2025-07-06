
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  description?: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token and get user data
      fetchUserData(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      // This would normally make an API call to verify the token
      // For demo purposes, we'll simulate with localStorage
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Check if user is admin
      const isAdmin = email === 'hkhero50@gmail.com';
      
      // Simulate API call - in real app, this would make HTTP request to MongoDB
      const userData: User = {
        _id: Date.now().toString(),
        email,
        name: isAdmin ? 'Harez Uddin Hero' : email.split('@')[0],
        isAdmin,
        avatar: isAdmin ? '/teacher-avatar.jpg' : undefined
      };

      localStorage.setItem('authToken', 'demo-token-' + Date.now());
      localStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Check if email already exists (in real app, this would be server-side validation)
      const existingUser = localStorage.getItem(`user_${email}`);
      if (existingUser) {
        throw new Error('Email already exists');
      }

      const isAdmin = email === 'hkhero50@gmail.com';
      
      const userData: User = {
        _id: Date.now().toString(),
        email,
        name: isAdmin ? 'Harez Uddin Hero' : name,
        isAdmin,
        avatar: isAdmin ? '/teacher-avatar.jpg' : undefined
      };

      localStorage.setItem('authToken', 'demo-token-' + Date.now());
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem(`user_${email}`, JSON.stringify(userData));
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('userData', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      updateProfile,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
