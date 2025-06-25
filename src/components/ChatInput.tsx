import { useState } from "react";
import { Send, Mic, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@/contexts/ChatContext";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const { samMode, samModel } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              samMode === "sam"
                ? "Yo, what's on your mind?"
                : "Type your message..."
            }
            className="min-h-[44px] max-h-32 resize-none bg-background/50 border-border/50 focus:border-neon-blue/50 focus:ring-neon-blue/20 pr-12"
            disabled={disabled}
          />
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            ⌘ + Enter
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <Mic className="w-5 h-5" />
        </Button>

        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          className="bg-neon-blue hover:bg-neon-blue/90 text-background border-0 shadow-lg shadow-neon-blue/20"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>

      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            SAM.exe v2.0 • {samModel.toUpperCase()} •{" "}
            {samMode === "sam" ? "No filter mode" : "Corporate mode"}
          </span>
          <div className="flex items-center gap-1">
            <div
              className={`w-1.5 h-1.5 rounded-full animate-pulse-slow ${
                samMode === "sam" ? "bg-neon-red" : "bg-neon-blue"
              }`}
            ></div>
            <span>{samMode === "sam" ? "Unfiltered" : "Filtered"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span>{message.length}/4000</span>
        </div>
      </div>
    </div>
  );
}
