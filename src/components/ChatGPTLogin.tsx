import { useState } from "react";
import { Eye, EyeOff, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/ChatGPTAuthContext";

export function ChatGPTLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    displayName: "",
  });

  const { login, register, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        await login(formData.username || formData.email, formData.password);
      } else {
        await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
        });
      }
    } catch (error) {
      // Error handling is done in the auth context
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center">
              <Bot className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to ChatGPT
          </h1>
          <p className="text-gray-400">
            {isLogin
              ? "Sign in to continue your conversations"
              : "Create your account to get started"}
          </p>
        </div>

        {/* Login/Register Form */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">
                Username {!isLogin && "or Email"}
              </Label>
              <Input
                id="username"
                type="text"
                placeholder={
                  isLogin ? "Enter username or email" : "Choose a username"
                }
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500"
              />
            </div>

            {/* Email (Register only) */}
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-white">
                    Display Name
                  </Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="How should we call you?"
                    value={formData.displayName}
                    onChange={(e) =>
                      handleInputChange("displayName", e.target.value)
                    }
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500"
                  />
                </div>
              </>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  required
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium h-11"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isLogin
                ? isLoading
                  ? "Signing in..."
                  : "Sign in"
                : isLoading
                  ? "Creating account..."
                  : "Create account"}
            </Button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-green-400 hover:text-green-300 text-sm font-medium"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm">
          <p>Your data is stored locally and privately on your device.</p>
          <p className="mt-1">By continuing, you agree to our terms of use.</p>
        </div>
      </div>
    </div>
  );
}
