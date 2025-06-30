import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    displayName: string;
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on app start
    const savedUser = localStorage.getItem("sam_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem("sam_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem("sam_users") || "[]");

      // Find user by username or email
      const foundUser = users.find(
        (u: any) =>
          (u.username === identifier || u.email === identifier) &&
          u.password === password,
      );

      if (!foundUser) {
        throw new Error("Invalid username/email or password");
      }

      const userToSet = {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        displayName: foundUser.displayName,
        createdAt: foundUser.createdAt,
      };

      setUser(userToSet);
      localStorage.setItem("sam_user", JSON.stringify(userToSet));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    displayName: string;
  }) => {
    setIsLoading(true);
    try {
      // Get existing users
      const users = JSON.parse(localStorage.getItem("sam_users") || "[]");

      // Check if username or email already exists
      const existingUser = users.find(
        (u: any) =>
          u.username === userData.username || u.email === userData.email,
      );

      if (existingUser) {
        throw new Error(
          existingUser.username === userData.username
            ? "Username already exists"
            : "Email already exists",
        );
      }

      // Create new user
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...userData,
        createdAt: new Date().toISOString(),
      };

      // Save to users list
      users.push(newUser);
      localStorage.setItem("sam_users", JSON.stringify(users));

      // Create user directory structure
      const userDir = `sam_user_${newUser.id}`;
      localStorage.setItem(`${userDir}_chats`, JSON.stringify([]));
      localStorage.setItem(
        `${userDir}_memory`,
        JSON.stringify({
          facts: [],
          personality_preferences: {},
          last_updated: new Date().toISOString(),
        }),
      );
      localStorage.setItem(`${userDir}_personalities`, JSON.stringify([]));

      const userToSet = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.displayName,
        createdAt: newUser.createdAt,
      };

      setUser(userToSet);
      localStorage.setItem("sam_user", JSON.stringify(userToSet));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sam_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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
