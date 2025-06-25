import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  name: string;
  email: string;
  isCreator: boolean;
  isPro: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem("sam_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const isSpecialUser =
        email === "suhaebroshan445@gmail.com" &&
        password === "6969_sam.is.real.lmfao";

      const user = {
        id: "1",
        name: isSpecialUser ? "Suhaeb" : "User",
        email,
        isCreator: isSpecialUser,
        isPro: isSpecialUser,
      };

      setUser(user);
      localStorage.setItem("sam_user", JSON.stringify(user));
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const isSpecialUser =
        email === "suhaebroshan445@gmail.com" &&
        password === "6969_sam.is.real.lmfao";

      const user = {
        id: Date.now().toString(),
        name: isSpecialUser ? "Suhaeb" : name,
        email,
        isCreator: isSpecialUser,
        isPro: isSpecialUser,
      };

      setUser(user);
      localStorage.setItem("sam_user", JSON.stringify(user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sam_user");
    localStorage.removeItem("sam_chats");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
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
