import { Plus, MessageSquare, Trash2, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  isActive?: boolean;
}

const conversations: Conversation[] = [
  {
    id: "1",
    title: "New Chat",
    lastMessage:
      "can I release you to public without any legal complications with the way you talk?",
    timestamp: "Today",
    isActive: true,
  },
  {
    id: "2",
    title: "AI Ethics Discussion",
    lastMessage: "Let's discuss the boundaries of AI conversation...",
    timestamp: "Yesterday",
  },
  {
    id: "3",
    title: "System Configuration",
    lastMessage: "Configuring response modes and filters...",
    timestamp: "2 days ago",
  },
];

export default function ChatSidebar() {
  return (
    <div className="w-80 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <Button className="w-full justify-start gap-2 bg-sidebar-primary hover:bg-sidebar-primary/90">
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
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                conversation.isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
              }`}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {conversation.title}
                  </p>
                  <p className="text-xs text-sidebar-foreground/70 line-clamp-2 mt-1">
                    {conversation.lastMessage}
                  </p>
                  <p className="text-xs text-sidebar-foreground/50 mt-1">
                    {conversation.timestamp}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
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
            <p className="font-medium text-sm">Suhaeb</p>
            <p className="text-xs text-sidebar-foreground/70">AI Creator</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Pro
          </Badge>
        </div>

        {/* Bot Status */}
        <div className="mt-3 p-3 rounded-lg bg-card/30 border">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-neon-red" />
            <span className="text-sm font-medium">SAM Status</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Roasting mode</p>
          <div className="flex items-center gap-1 mt-2">
            <div className="w-2 h-2 bg-neon-red rounded-full animate-pulse-slow"></div>
            <span className="text-xs text-neon-red">No filter active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
