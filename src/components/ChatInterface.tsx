import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import TopBar from "./TopBar";
import ChatSidebar from "./ChatSidebar";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { Message } from "@/contexts/ChatContext";
import { sendMessageToAI, prepareMessageHistory } from "@/lib/api";

export default function ChatInterface() {
  const { activeChat, addMessage, samMode, samModel } = useChat();
  const { user } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, isTyping]);

  const handleSendMessage = async (content: string) => {
    if (!activeChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    addMessage(activeChat.id, newMessage);
    setIsTyping(true);

    try {
      // Prepare message history for API
      const messageHistory = [...activeChat.messages, newMessage];
      const preparedHistory = prepareMessageHistory(messageHistory);

      // Get AI response
      const aiContent = await sendMessageToAI(
        preparedHistory,
        samMode,
        samModel,
        user?.id,
      );

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      addMessage(activeChat.id, aiResponse);
    } catch (error) {
      console.error("Error getting AI response:", error);

      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `❌ **Error**: ${error instanceof Error ? error.message : "Failed to connect to SAM. Please try again."}\n\n*Check your API key and internet connection.*`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      addMessage(activeChat.id, errorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <ChatSidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <TopBar />

        {/* Messages */}
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="space-y-0">
            {activeChat?.messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message.content}
                isUser={message.isUser}
                timestamp={message.timestamp}
              />
            ))}
            {isTyping && (
              <ChatMessage message="" isUser={false} isTyping={true} />
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  );
}
