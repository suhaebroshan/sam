import { useState } from "react";
import { Copy, ThumbsUp, ThumbsDown, RefreshCw, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatGPT } from "@/contexts/ChatGPTContext";
import { useAuth } from "@/contexts/ChatGPTAuthContext";

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  isTyping?: boolean;
  personalityMode?: string;
}

interface ChatGPTMessageProps {
  message: ChatMessage;
  isLast: boolean;
}

export function ChatGPTMessage({ message, isLast }: ChatGPTMessageProps) {
  const { user } = useAuth();
  const { regenerateResponse, currentPersonality } = useChatGPT();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    regenerateResponse(message.id);
  };

  if (message.isTyping) {
    return (
      <div className="flex gap-4 group">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="bg-gray-700 rounded-lg p-4 max-w-none">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                  style={{ animationDelay: "200ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                  style={{ animationDelay: "400ms" }}
                ></div>
              </div>
              <span className="text-sm text-gray-400">
                {currentPersonality === "sam"
                  ? "SAM is thinking..."
                  : "ChatGPT is thinking..."}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-4 group ${message.isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          message.isUser
            ? "bg-blue-500"
            : currentPersonality === "sam"
              ? "bg-red-500"
              : "bg-green-500"
        }`}
      >
        {message.isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${message.isUser ? "flex justify-end" : ""}`}>
        <div
          className={`rounded-lg p-4 max-w-none ${
            message.isUser
              ? "bg-blue-600 text-white ml-auto max-w-[80%]"
              : "bg-gray-700 text-white"
          }`}
        >
          <div
            className={`whitespace-pre-wrap break-words ${
              message.isUser ? "text-right" : ""
            }`}
          >
            {message.content}
          </div>

          {/* Message Actions (for AI responses only) */}
          {!message.isUser && !message.isTyping && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-gray-400 hover:text-white h-8"
              >
                <Copy className="w-4 h-4 mr-1" />
                {copied ? "Copied!" : "Copy"}
              </Button>

              {isLast && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  className="text-gray-400 hover:text-white h-8"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
              )}

              <div className="flex gap-1 ml-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-gray-400 hover:text-green-400"
                >
                  <ThumbsUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-gray-400 hover:text-red-400"
                >
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Timestamp */}
        {!message.isTyping && (
          <div
            className={`text-xs text-gray-400 mt-1 ${
              message.isUser ? "text-right" : ""
            }`}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
}
