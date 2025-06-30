import { useState, useRef, useEffect } from "react";
import {
  Send,
  Menu,
  RefreshCw,
  Square,
  Bot,
  MessageSquare,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useChatGPT } from "@/contexts/ChatGPTContext";
import { useAuth } from "@/contexts/ChatGPTAuthContext";
import { useNotifications } from "../hooks/useNotifications";
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
  const { sendNotification, requestPermission } = useNotifications();
  const {
    // Regular chat
    activeChat,
    sendMessage,
    currentPersonality,
    setPersonality,
    // Custom GPT
    activeGPT,
    activeGPTChat,
    sendGPTMessage,
    // Common
    isTyping,
    isStreaming,
    stopGeneration,
    regenerateLastResponse,
    mode,
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
  }, [activeChat?.messages, activeGPTChat?.messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isStreaming) return;

    const messageToSend = message.trim();
    setMessage("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (mode === "gpt" && activeGPT) {
      await sendGPTMessage(activeGPT.id, messageToSend);
    } else {
      await sendMessage(messageToSend);
    }
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

  // Determine current context
  const currentChat = mode === "gpt" ? activeGPTChat : activeChat;
  const hasMessages = currentChat?.messages && currentChat.messages.length > 0;

  // Get title and context info
  const getTitle = () => {
    if (mode === "gpt" && activeGPT) {
      return activeGPT.name;
    }
    return activeChat?.title || "SAM.exe";
  };

  const getPlaceholder = () => {
    if (mode === "gpt" && activeGPT) {
      return `Message ${activeGPT.name}...`;
    }
    return currentPersonality === "sam"
      ? "Yo, what's on your mind?"
      : currentPersonality === "corporate"
        ? "Message SAM..."
        : "Start typing your message...";
  };

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
            <div className="flex items-center gap-3">
              {mode === "gpt" && activeGPT && (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: activeGPT.colorTheme?.primary }}
                >
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <h1 className="text-lg font-semibold text-white">{getTitle()}</h1>
              {mode === "gpt" && activeGPT && (
                <Badge
                  variant="secondary"
                  className="bg-blue-600 text-white text-xs"
                >
                  Custom GPT
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              {mode === "normal" && (
                <PersonalitySelector
                  value={currentPersonality}
                  onChange={setPersonality}
                />
              )}
              {mode === "gpt" && activeGPT && (
                <span className="text-xs text-gray-400">
                  {activeGPT.description || "Custom AI Personality"}
                </span>
              )}
              {isStreaming && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Generating...
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification test button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              console.log("Testing notification...");
              await requestPermission();
              const success = await sendNotification({
                title: "Test Notification",
                body: "This is a test notification from SAM.exe!",
                requireInteraction: true,
              });
              console.log("Notification test result:", success);
            }}
            className="text-gray-400 hover:text-white"
            title="Test Notifications"
          >
            <Bell className="w-4 h-4" />
          </Button>

          {hasMessages && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
        <div className="max-w-4xl mx-auto py-4">
          {!hasMessages ? (
            <ChatGPTWelcome
              onStartChat={(prompt) => setMessage(prompt)}
              mode={mode}
              gptName={activeGPT?.name}
              gptDescription={activeGPT?.description}
            />
          ) : (
            <div className="space-y-6">
              {currentChat?.messages.map((msg, index) => (
                <ChatGPTMessage
                  key={msg.id}
                  message={msg}
                  isLast={index === currentChat.messages.length - 1}
                  gptTheme={
                    mode === "gpt" && activeGPT
                      ? activeGPT.colorTheme
                      : undefined
                  }
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
                  gptTheme={
                    mode === "gpt" && activeGPT
                      ? activeGPT.colorTheme
                      : undefined
                  }
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
                placeholder={getPlaceholder()}
                className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent text-white placeholder-gray-400 focus:ring-0 pr-12"
                disabled={isStreaming}
              />

              <Button
                type="submit"
                size="icon"
                disabled={!canSend}
                className={`absolute right-2 bottom-2 h-8 w-8 ${
                  canSend
                    ? mode === "gpt" && activeGPT
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-white hover:bg-gray-100 text-black"
                    : "bg-gray-600 text-gray-400"
                }`}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Context indicator */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                {mode === "gpt" && activeGPT ? (
                  <>
                    <Bot className="w-3 h-3" />
                    <span>Chatting with {activeGPT.name}</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-3 h-3" />
                    <span>
                      Using{" "}
                      {currentPersonality === "sam"
                        ? "SAM"
                        : currentPersonality === "corporate"
                          ? "Corporate"
                          : "Custom"}{" "}
                      mode
                    </span>
                  </>
                )}
              </div>
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
