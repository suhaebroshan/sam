import { useState } from "react";
import { Trash2, Brain, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserMemories,
  saveUserMemories,
  clearUserMemories,
} from "@/lib/memory";

export default function MemoriesDialog() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [memories, setMemories] = useState<string[]>([]);

  const loadMemories = () => {
    if (user?.id) {
      const userMemories = getUserMemories(user.id);
      setMemories(userMemories?.facts || []);
    }
  };

  const handleDeleteMemory = (index: number) => {
    if (!user?.id) return;

    const updatedMemories = memories.filter((_, i) => i !== index);
    setMemories(updatedMemories);
    saveUserMemories(user.id, updatedMemories);
  };

  const handleClearAllMemories = () => {
    if (!user?.id) return;

    setMemories([]);
    clearUserMemories(user.id);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      loadMemories();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Brain className="w-4 h-4" />
          <span>Memories</span>
          {memories.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {memories.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-neon-blue" />
            SAM's Memories About You
          </DialogTitle>
          <DialogDescription>
            These are the things SAM remembers about you from your
            conversations. You can delete any memories you don't want SAM to
            remember.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {memories.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No Memories Yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Start chatting with SAM and mention personal details. He'll
                remember things like your name, interests, job, and more!
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  SAM knows {memories.length} thing
                  {memories.length !== 1 ? "s" : ""} about you
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAllMemories}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {memories.map((memory, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/50 group hover:border-border transition-colors"
                    >
                      <div className="w-2 h-2 bg-neon-blue rounded-full mt-2 shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground break-words">
                          {memory}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteMemory(index)}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Tip:</strong> SAM automatically learns about you as
                  you chat. He picks up on things like your name, age, location,
                  job, interests, and preferences.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
