import { useState } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  User,
  Bot,
  Edit3,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";

export default function ChatSidebar() {
  const {
    chats,
    activeChat,
    createNewChat,
    selectChat,
    deleteChat,
    renameChat,
    samMode,
  } = useChat();
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

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

  const handleDelete = (chatId: string) => {
    deleteChat(chatId);
  };

  return (
    <div className="w-80 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <Button
          onClick={createNewChat}
          className="w-full justify-start gap-2 bg-sidebar-primary hover:bg-sidebar-primary/90"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <h3 className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wide px-2 py-1">
            Conversations
          </h3>
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                chat.isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
              }`}
              onClick={() => !editingId && selectChat(chat.id)}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  {editingId === chat.id ? (
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleSaveRename(chat.id)}
                      onKeyDown={(e) => handleKeyDown(e, chat.id)}
                      className="h-6 text-sm font-medium bg-transparent border-0 p-0 focus:ring-0"
                      autoFocus
                    />
                  ) : (
                    <p className="font-medium text-sm truncate">{chat.title}</p>
                  )}
                  <p className="text-xs text-sidebar-foreground/70 line-clamp-2 mt-1">
                    {chat.lastMessage || "No messages yet"}
                  </p>
                  <p className="text-xs text-sidebar-foreground/50 mt-1">
                    {chat.timestamp}
                  </p>
                </div>
              </div>

              {editingId !== chat.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRename(chat.id, chat.title);
                      }}
                    >
                      <Edit3 className="w-3 h-3 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(chat.id);
                      }}
                      className="text-neon-red"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent">
          <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{user?.name || "User"}</p>
            <p className="text-xs text-sidebar-foreground/70">AI Creator</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Pro
          </Badge>
        </div>

        {/* Bot Status */}
        <div className="mt-3 p-3 rounded-lg bg-card/30 border">
          <div className="flex items-center gap-2">
            <Bot
              className={`w-4 h-4 ${samMode === "sam" ? "text-neon-red" : "text-neon-blue"}`}
            />
            <span className="text-sm font-medium">SAM Status</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {samMode === "sam" ? "Roasting mode" : "Professional mode"}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <div
              className={`w-2 h-2 rounded-full animate-pulse-slow ${
                samMode === "sam" ? "bg-neon-red" : "bg-neon-blue"
              }`}
            ></div>
            <span
              className={`text-xs ${
                samMode === "sam" ? "text-neon-red" : "text-neon-blue"
              }`}
            >
              {samMode === "sam"
                ? "No filter active"
                : "Corporate filter active"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
