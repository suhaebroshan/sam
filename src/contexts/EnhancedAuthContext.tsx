import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import apiService, { User } from "@/lib/apiService";
import { toast } from "sonner";

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
  updateProfile: (updates: Partial<User>) => Promise<void>;
  isLoading: boolean;
  isConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize authentication state
    const initAuth = async () => {
      const token = localStorage.getItem("sam_token");
      if (token) {
        try {
          const profile = await apiService.getProfile();
          setUser(profile);
          setIsConnected(apiService.isConnected());
        } catch (error) {
          console.error("Failed to load user profile:", error);
          localStorage.removeItem("sam_token");
        }
      }
      setIsLoading(false);
    };

    initAuth();

    // Set up real-time event listeners
    const handleAuthenticated = (userData: User) => {
      setUser(userData);
      setIsConnected(true);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
    };

    const handleLoggedOut = () => {
      setUser(null);
      setIsConnected(false);
    };

    apiService.on("authenticated", handleAuthenticated);
    apiService.on("disconnected", handleDisconnected);
    apiService.on("logged_out", handleLoggedOut);

    // Connection status polling
    const connectionCheck = setInterval(() => {
      setIsConnected(apiService.isConnected());
    }, 5000);

    return () => {
      apiService.off("authenticated", handleAuthenticated);
      apiService.off("disconnected", handleDisconnected);
      apiService.off("logged_out", handleLoggedOut);
      clearInterval(connectionCheck);
    };
  }, []);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.login({ identifier, password });
      setUser(response.user);
      toast.success(`Welcome back, ${response.user.displayName}!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message);
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
      const response = await apiService.register(userData);
      setUser(response.user);
      toast.success(`Welcome to SAM, ${response.user.displayName}!`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    setIsConnected(false);
    toast.info("You have been logged out");
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      await apiService.updateProfile(updates);
      if (user) {
        setUser({ ...user, ...updates });
      }
      toast.success("Profile updated successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update profile";
      toast.error(message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateProfile,
        isLoading,
        isConnected,
      }}
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
