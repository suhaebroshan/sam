import { useState, useEffect } from "react";
import { ChatGPTSidebar } from "./ChatGPTSidebar";
import { ChatGPTMainArea } from "./ChatGPTMainArea";
import { useChatGPT } from "@/contexts/ChatGPTContext";
import { useAuth } from "@/contexts/ChatGPTAuthContext";
import { ChatGPTLogin } from "./ChatGPTLogin";

export function ChatGPTInterface() {
  const { user } = useAuth();
  const { activeChat, isLoading } = useChatGPT();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!user) {
    return <ChatGPTLogin />;
  }

  return (
    <div className="h-screen bg-gray-800 text-white flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 bg-gray-900 border-r border-gray-700 flex-shrink-0 overflow-hidden`}
      >
        <ChatGPTSidebar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatGPTMainArea
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>
    </div>
  );
}
