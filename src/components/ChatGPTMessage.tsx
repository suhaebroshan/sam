import { useState } from "react";
import { Copy, ThumbsUp, ThumbsDown, RefreshCw, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatGPT } from "@/contexts/ChatGPTContext";
import { useAuth } from "@/contexts/ChatGPTAuthContext";
import ReactMarkdown from "react-markdown";

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
  gptTheme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
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
                  : "SAM is thinking..."}
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
          <div className={`break-words ${message.isUser ? "text-right" : ""}`}>
            {message.isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <div className="prose-chat">
                <ReactMarkdown
                  components={{
                    // Custom styling for markdown elements
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0 text-white">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-white">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-gray-300">{children}</em>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-600 text-green-400 px-1 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-gray-600 p-3 rounded-lg my-2 overflow-x-auto">
                        <code className="text-green-400 font-mono text-sm">
                          {children}
                        </code>
                      </pre>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-2 text-white">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-2 text-white">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="mb-1 text-white">{children}</li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gray-500 pl-4 italic text-gray-300 my-2">
                        {children}
                      </blockquote>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-xl font-bold mb-2 text-white">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-bold mb-2 text-white">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-md font-bold mb-2 text-white">
                        {children}
                      </h3>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
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
