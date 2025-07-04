import { useState } from "react";
import {
  Plus,
  MessageSquare,
  Edit3,
  Trash2,
  MoreHorizontal,
  User,
  Settings,
  LogOut,
  Brain,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatGPT } from "@/contexts/ChatGPTContext";
import { useAuth } from "@/contexts/ChatGPTAuthContext";
import { ChatGPTSettingsModal } from "./ChatGPTSettingsModal";
import { CustomGPTManager } from "./CustomGPTManager";
import { CustomGPTCard } from "./CustomGPTCard";

interface ChatGPTSidebarProps {
  onToggleSidebar: () => void;
}

export function ChatGPTSidebar({ onToggleSidebar }: ChatGPTSidebarProps) {
  const { user, logout } = useAuth();
  const {
    chats,
    activeChat,
    createNewChat,
    selectChat,
    deleteChat,
    renameChat,
    // Custom GPTs
    customGPTs,
    activeGPT,
    gptChats,
    activeGPTChat,
    saveCustomGPT,
    deleteCustomGPT,
    selectGPT,
    createNewGPTChat,
    selectGPTChat,
    deleteGPTChat,
    toggleGPTActive,
    mode,
    setMode,
  } = useChatGPT();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showGPTManager, setShowGPTManager] = useState(false);

  const handleRename = (chatId: string, currentTitle: string) => {
    setEditingId(chatId);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (chatId: string) => {
    if (editingTitle.trim()) {
      renameChat(chatId, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === "Enter") {
      handleSaveRename(chatId);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  // Group chats by date
  const groupedChats = chats.reduce((groups: any, chat) => {
    const dateGroup = formatDate(chat.createdAt);
    if (!groups[dateGroup]) {
      groups[dateGroup] = [];
    }
    groups[dateGroup].push(chat);
    return groups;
  }, {});

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-2 border-b border-gray-700">
        <Button
          onClick={createNewChat}
          className="w-full justify-start gap-3 bg-transparent hover:bg-gray-800 border border-gray-600 text-white h-11"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          New chat
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-4">
          {/* Regular Chats */}
          <div className="space-y-1">
            {Object.entries(groupedChats).map(([dateGroup, chats]) => (
              <div key={dateGroup} className="mb-4">
                {/* Date Header */}
                <div className="text-xs text-gray-400 font-medium mb-2 px-2">
                  {dateGroup}
                </div>

                {/* Chats in this date group */}
                <div className="space-y-1">
                  {(chats as any[]).map((chat) => (
                    <div
                      key={chat.id}
                      className={`group relative rounded-lg transition-colors ${
                        activeChat?.id === chat.id && mode === "normal"
                          ? "bg-gray-800"
                          : "hover:bg-gray-800"
                      }`}
                    >
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer"
                        onClick={() => !editingId && selectChat(chat.id)}
                      >
                        <MessageSquare className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          {editingId === chat.id ? (
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onBlur={() => handleSaveRename(chat.id)}
                              onKeyDown={(e) => handleKeyDown(e, chat.id)}
                              className="h-6 text-sm bg-transparent border-0 p-0 focus:ring-0 text-white"
                              autoFocus
                            />
                          ) : (
                            <div className="text-sm text-white truncate">
                              {chat.title}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {editingId !== chat.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-gray-800 border-gray-600"
                            >
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRename(chat.id, chat.title);
                                }}
                                className="text-white hover:bg-gray-700"
                              >
                                <Edit3 className="w-4 h-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteChat(chat.id);
                                }}
                                className="text-red-400 hover:bg-gray-700"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {chats.length === 0 && customGPTs.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">Start a new chat to get going!</p>
              </div>
            )}
          </div>

          {/* Custom GPTs Section */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400 font-medium">
                  🧠 My Custom GPTs
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowGPTManager(true)}
                className="h-6 w-6 text-gray-400 hover:text-white"
                title="Create new Custom GPT"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            {customGPTs.length > 0 ? (
              <div className="space-y-1">
                {customGPTs.map((gpt) => {
                  const gptChatCount = (gptChats[gpt.id] || []).length;
                  return (
                    <CustomGPTCard
                      key={gpt.id}
                      gpt={gpt}
                      isActive={activeGPT?.id === gpt.id && mode === "gpt"}
                      onSelect={() => selectGPT(gpt.id)}
                      onEdit={() => {
                        // Handle edit - open GPT manager with this GPT
                        setShowGPTManager(true);
                      }}
                      onDelete={() => deleteCustomGPT(gpt.id)}
                      onToggleActive={() => toggleGPTActive(gpt.id)}
                      chatCount={gptChatCount}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 px-2">
                  Create custom AI personalities with unique styles and
                  behaviors
                </p>
                <Button
                  onClick={() => setShowGPTManager(true)}
                  className="w-full justify-start gap-3 bg-transparent hover:bg-gray-800 border border-gray-600 text-white h-10"
                  variant="outline"
                >
                  <Brain className="w-4 h-4" />
                  Create Custom GPT
                </Button>
                {/* Quick test GPT for debugging */}
                <Button
                  onClick={() => {
                    console.log("Creating test GPT...");
                    const testGPT = {
                      id: `test_gpt_${Date.now()}`,
                      name: "Test Helper",
                      description: "A friendly test assistant",
                      systemPrompt:
                        "You are a friendly test assistant. Be helpful and kind.",
                      speakingStyle: "friendly" as const,
                      colorTheme: {
                        primary: "#3B82F6",
                        secondary: "#1E40AF",
                        accent: "#60A5FA",
                      },
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      messageCount: 0,
                      isActive: true,
                    };
                    saveCustomGPT(testGPT);
                  }}
                  className="w-full justify-start gap-3 bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                  variant="default"
                >
                  <Bot className="w-3 h-3" />
                  Quick Test GPT
                </Button>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* User Menu */}
      <div className="p-2 border-t border-gray-700">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-white hover:bg-gray-800 h-11"
            >
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium truncate">
                  {user?.displayName}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {user?.email}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64 bg-gray-800 border-gray-600"
          >
            <DropdownMenuItem
              onClick={() => setShowSettings(true)}
              className="text-white hover:bg-gray-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-600" />
            <DropdownMenuItem
              onClick={logout}
              className="text-red-400 hover:bg-gray-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Settings Modal */}
      <ChatGPTSettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
      />

      <CustomGPTManager
        open={showGPTManager}
        onOpenChange={setShowGPTManager}
        customGPTs={customGPTs}
        onSaveGPT={saveCustomGPT}
        onDeleteGPT={deleteCustomGPT}
        maxGPTs={10}
      />
    </div>
  );
}
