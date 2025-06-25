import { Settings, User, Zap, LogOut, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";

export default function TopBar() {
  const { samMode, samModel, setSamMode, setSamModel, clearAllChats } =
    useChat();
  const { user, logout } = useAuth();

  const handleClearChats = () => {
    clearAllChats();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-neon-blue rounded-md flex items-center justify-center">
          <Zap className="w-5 h-5 text-background animate-pulse-slow" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neon-blue tracking-wide">
            SAM.exe
          </h1>
          <p className="text-xs text-muted-foreground -mt-1">
            {samMode === "sam"
              ? "Unfiltered AI Energy"
              : "Corporate Mode Active"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-2 text-xs text-muted-foreground bg-card px-3 py-1.5 rounded-full border ${
            samMode === "sam" ? "border-neon-red/30" : "border-neon-blue/30"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full animate-pulse-slow ${
              import.meta.env.VITE_OPENROUTER_API_KEY
                ? samMode === "sam"
                  ? "bg-neon-red"
                  : "bg-neon-blue"
                : "bg-yellow-500"
            }`}
          ></div>
          <span>
            {import.meta.env.VITE_OPENROUTER_API_KEY
              ? samMode === "sam"
                ? "No Filter"
                : "Filtered"
              : "API Missing"}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setSamModel("gpt-4o")}>
              <span>GPT-4o</span>
              {samModel === "gpt-4o" && <Check className="w-4 h-4 ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSamModel("gpt-3.5")}>
              <span>GPT-3.5</span>
              {samModel === "gpt-3.5" && <Check className="w-4 h-4 ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSamMode("sam")}>
              <span>Sam Mode</span>
              {samMode === "sam" && <Check className="w-4 h-4 ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSamMode("corporate")}>
              <span>Corporate Mode</span>
              {samMode === "corporate" && <Check className="w-4 h-4 ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleClearChats}>
              <span>Clear All Chats</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled>
              <span className="font-medium">{user?.name}</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <span className="text-xs text-muted-foreground">
                {user?.email}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-neon-red">
              <LogOut className="w-4 h-4 mr-2" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
