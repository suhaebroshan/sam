import { useState, useRef, useEffect } from "react";
import { Send, Menu, RefreshCw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatGPT } from "@/contexts/ChatGPTContext";
import { useAuth } from "@/contexts/ChatGPTAuthContext";
import { ChatGPTMessage } from "./ChatGPTMessage";
import { ChatGPTWelcome } from "./ChatGPTWelcome";
import { PersonalitySelector } from "./PersonalitySelector";

interface ChatGPTMainAreaProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function ChatGPTMainArea({
  sidebarOpen,
  onToggleSidebar,
}: ChatGPTMainAreaProps) {
  const { user } = useAuth();
  const {
    activeChat,
    sendMessage,
    isTyping,
    isStreaming,
    stopGeneration,
    regenerateLastResponse,
    currentPersonality,
    setPersonality,
  } = useChatGPT();

  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isStreaming) return;

    const messageToSend = message.trim();
    setMessage("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await sendMessage(messageToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = Math.min(scrollHeight, 200) + "px";
  };

  const canSend = message.trim() && !isStreaming;
  const hasMessages = activeChat?.messages && activeChat.messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="text-gray-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-white">
              {activeChat?.title || "ChatGPT"}
            </h1>
            <div className="flex items-center gap-2">
              <PersonalitySelector
                value={currentPersonality}
                onChange={setPersonality}
              />
              {isStreaming && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Generating...
                </span>
              )}
            </div>
          </div>
        </div>

        {hasMessages && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={regenerateLastResponse}
              disabled={isStreaming}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
            {isStreaming && (
              <Button
                variant="ghost"
                size="sm"
                onClick={stopGeneration}
                className="text-red-400 hover:text-red-300"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
        <div className="max-w-4xl mx-auto py-4">
          {!hasMessages ? (
            <ChatGPTWelcome onStartChat={(prompt) => setMessage(prompt)} />
          ) : (
            <div className="space-y-6">
              {activeChat?.messages.map((msg, index) => (
                <ChatGPTMessage
                  key={msg.id}
                  message={msg}
                  isLast={index === activeChat.messages.length - 1}
                />
              ))}

              {isTyping && (
                <ChatGPTMessage
                  message={{
                    id: "typing",
                    content: "",
                    isUser: false,
                    timestamp: new Date().toISOString(),
                    isTyping: true,
                  }}
                  isLast={true}
                />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative bg-gray-700 rounded-lg border border-gray-600 focus-within:border-gray-500">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  currentPersonality === "sam"
                    ? "Yo, what's on your mind?"
                    : currentPersonality === "corporate"
                      ? "Message ChatGPT..."
                      : "Start typing your message..."
                }
                className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent text-white placeholder-gray-400 focus:ring-0 pr-12"
                disabled={isStreaming}
              />

              <Button
                type="submit"
                size="icon"
                disabled={!canSend}
                className="absolute bottom-2 right-2 h-8 w-8 bg-white text-gray-800 hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center mt-3 text-xs text-gray-400">
              <span>
                ChatGPT can make mistakes. Consider checking important
                information.
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
