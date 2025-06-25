import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import TopBar from "./TopBar";
import ChatSidebar from "./ChatSidebar";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useChat } from "@/contexts/ChatContext";
import { Message } from "@/contexts/ChatContext";

export default function ChatInterface() {
  const { activeChat, addMessage, samMode } = useChat();
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

    // Simulate AI response delay
    setTimeout(() => {
      const samResponses = [
        "Yo, that's actually fire! Let me break that down for you...",
        "Bruh, real talk - that's some deep shit you're asking about.",
        "Aight, listen up. Here's the deal...",
        "Damn, you really went there. Respect. Let me hit you with some truth...",
        "Okay okay, I see you. That's actually a solid question.",
        "Nah fam, that ain't it. Let me explain why...",
        "Yooo, this is getting spicy! Here's my take...",
      ];

      const corporateResponses = [
        "Thank you for your question. Let me provide you with a comprehensive response.",
        "I appreciate your inquiry. Here's a professional analysis of the topic.",
        "That's an excellent question. Allow me to explain this thoroughly.",
        "I understand your concern. Let me address this in a structured manner.",
        "Thank you for bringing this up. Here's my professional perspective.",
      ];

      const responses = samMode === "sam" ? samResponses : corporateResponses;

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: responses[Math.floor(Math.random() * responses.length)],
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      addMessage(activeChat.id, aiResponse);
      setIsTyping(false);
    }, 2000);
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
