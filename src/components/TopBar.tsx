import { Settings, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TopBar() {
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
            Unfiltered AI Energy
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card px-3 py-1.5 rounded-full border">
          <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse-slow"></div>
          <span>Active</span>
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
            <DropdownMenuItem>
              <span>GPT-4o</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>GPT-3.5</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span>Sam Mode</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>Corporate Mode</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span>Clear Chat</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <User className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
