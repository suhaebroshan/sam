import { User, Bot, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  isTyping?: boolean;
}

export default function ChatMessage({
  message,
  isUser,
  timestamp,
  isTyping,
}: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex gap-3 p-4 group",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 bg-neon-red/20 rounded-full flex items-center justify-center shrink-0 border border-neon-red/30">
          <Bot className="w-4 h-4 text-neon-red" />
        </div>
      )}

      <div className={cn("max-w-[70%] space-y-2", isUser ? "order-first" : "")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 relative",
            isUser
              ? "bg-chat-user text-background ml-auto"
              : "bg-card border border-border text-foreground",
          )}
        >
          {isTyping ? (
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-neon-red rounded-full animate-typing"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-neon-red rounded-full animate-typing"
                  style={{ animationDelay: "200ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-neon-red rounded-full animate-typing"
                  style={{ animationDelay: "400ms" }}
                ></div>
              </div>
              <span className="text-xs text-neon-red ml-2">
                SAM is thinking...
              </span>
            </div>
          ) : (
            <p
              className={cn(
                "text-sm leading-relaxed",
                !isUser && "font-mono tracking-wide",
              )}
            >
              {message}
            </p>
          )}

          {/* Message tail */}
          <div
            className={cn(
              "absolute top-4 w-0 h-0",
              isUser
                ? "right-[-8px] border-l-8 border-l-chat-user border-t-4 border-t-transparent border-b-4 border-b-transparent"
                : "left-[-8px] border-r-8 border-r-card border-t-4 border-t-transparent border-b-4 border-b-transparent",
            )}
          ></div>
        </div>

        {timestamp && (
          <p
            className={cn(
              "text-xs text-muted-foreground",
              isUser ? "text-right" : "text-left",
            )}
          >
            {timestamp}
          </p>
        )}

        {!isUser && !isTyping && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-neon-green"
            >
              <ThumbsUp className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-neon-red"
            >
              <ThumbsDown className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-chat-user/20 rounded-full flex items-center justify-center shrink-0 border border-chat-user/30">
          <User className="w-4 h-4 text-chat-user" />
        </div>
      )}
    </div>
  );
}
