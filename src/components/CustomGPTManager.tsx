import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Plus,
  Edit3,
  Trash2,
  Palette,
  MessageSquare,
  Bot,
  Save,
  X,
} from "lucide-react";
import {
  CustomGPT,
  SPEAKING_STYLES,
  DEFAULT_COLOR_THEMES,
} from "../types/customGPT";

interface CustomGPTManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customGPTs: CustomGPT[];
  onSaveGPT: (gpt: CustomGPT) => void;
  onDeleteGPT: (gptId: string) => void;
  maxGPTs?: number;
}

export function CustomGPTManager({
  open,
  onOpenChange,
  customGPTs,
  onSaveGPT,
  onDeleteGPT,
  maxGPTs = 10,
}: CustomGPTManagerProps) {
  const [activeTab, setActiveTab] = useState("list");
  const [editingGPT, setEditingGPT] = useState<CustomGPT | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    speakingStyle: "friendly" as const,
    colorTheme: DEFAULT_COLOR_THEMES[0],
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      systemPrompt: "",
      speakingStyle: "friendly",
      colorTheme: DEFAULT_COLOR_THEMES[0],
    });
    setEditingGPT(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setActiveTab("create");
  };

  const handleEdit = (gpt: CustomGPT) => {
    setEditingGPT(gpt);
    setFormData({
      name: gpt.name,
      description: gpt.description,
      systemPrompt: gpt.systemPrompt,
      speakingStyle: gpt.speakingStyle,
      colorTheme: gpt.colorTheme || DEFAULT_COLOR_THEMES[0],
    });
    setActiveTab("create");
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    const now = new Date().toISOString();
    const gpt: CustomGPT = {
      id:
        editingGPT?.id ||
        `gpt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      systemPrompt: formData.systemPrompt.trim() || generateSystemPrompt(),
      speakingStyle: formData.speakingStyle,
      colorTheme: formData.colorTheme,
      createdAt: editingGPT?.createdAt || now,
      updatedAt: now,
      messageCount: editingGPT?.messageCount || 0,
      isActive: editingGPT?.isActive || false,
    };

    onSaveGPT(gpt);
    resetForm();
    setActiveTab("list");
  };

  const generateSystemPrompt = () => {
    const style = SPEAKING_STYLES[formData.speakingStyle];
    return `You are ${formData.name}, a custom AI personality.

${formData.description}

${style.prompt}

RESPONSE LENGTH: Keep responses to 6-7 lines maximum unless the user specifically asks for more detail or longer explanations. Be concise but impactful.

FORMATTING: Use markdown formatting like **bold text**, *italics*, \`code\`, and proper line breaks. Make your responses visually engaging.`;
  };

  const handleGeneratePrompt = () => {
    const generated = generateSystemPrompt();
    setFormData((prev) => ({ ...prev, systemPrompt: generated }));
  };

  const canCreateMore = customGPTs.length < maxGPTs;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Custom GPTs Manager
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Create and manage up to {maxGPTs} custom AI personalities
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="list" className="text-white">
              My GPTs ({customGPTs.length}/{maxGPTs})
            </TabsTrigger>
            <TabsTrigger value="create" className="text-white">
              {editingGPT ? "Edit GPT" : "Create New"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">
                Your Custom GPTs
              </h3>
              <Button
                onClick={handleCreateNew}
                disabled={!canCreateMore}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="grid gap-4">
                {customGPTs.map((gpt) => (
                  <Card key={gpt.id} className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: gpt.colorTheme?.primary }}
                          >
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-white text-base">
                              {gpt.name}
                            </CardTitle>
                            <p className="text-sm text-gray-400 mt-1">
                              {gpt.description || "No description"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(gpt)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onDeleteGPT(gpt.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <Badge variant="secondary" className="bg-gray-700">
                            {SPEAKING_STYLES[gpt.speakingStyle].label}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {gpt.messageCount} messages
                          </span>
                        </div>
                        {gpt.isActive && (
                          <Badge variant="default" className="bg-green-600">
                            Active
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {customGPTs.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No Custom GPTs yet</p>
                    <p className="text-sm">
                      Create your first custom AI personality to get started
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Basic Information
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">
                      Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter GPT name (e.g., Creative Writer, Code Helper)"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">
                      Description
                    </Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Brief description of this GPT's purpose"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>

                {/* Personality */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Personality
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="speaking-style" className="text-white">
                      Speaking Style
                    </Label>
                    <Select
                      value={formData.speakingStyle}
                      onValueChange={(value: any) =>
                        setFormData((prev) => ({
                          ...prev,
                          speakingStyle: value,
                        }))
                      }
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {Object.entries(SPEAKING_STYLES).map(([key, style]) => (
                          <SelectItem
                            key={key}
                            value={key}
                            className="text-white"
                          >
                            <div>
                              <div className="font-medium">{style.label}</div>
                              <div className="text-sm text-gray-400">
                                {style.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Color Theme */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Color Theme
                  </h3>

                  <div className="grid grid-cols-4 gap-3">
                    {DEFAULT_COLOR_THEMES.map((theme, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            colorTheme: theme,
                          }))
                        }
                        className={`aspect-square rounded-lg border-2 transition-all ${
                          formData.colorTheme === theme
                            ? "border-white"
                            : "border-gray-600 hover:border-gray-400"
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* System Prompt */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      System Prompt
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGeneratePrompt}
                      className="text-white border-gray-600"
                    >
                      Auto-Generate
                    </Button>
                  </div>

                  <Textarea
                    value={formData.systemPrompt}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        systemPrompt: e.target.value,
                      }))
                    }
                    placeholder="Describe how this GPT should behave and respond..."
                    className="min-h-[150px] bg-gray-800 border-gray-600 text-white"
                  />
                  <p className="text-sm text-gray-400">
                    This defines how your GPT will behave and respond to
                    messages
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={!formData.name.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingGPT ? "Update GPT" : "Create GPT"}
                  </Button>
                  <Button
                    onClick={() => {
                      resetForm();
                      setActiveTab("list");
                    }}
                    variant="outline"
                    className="text-white border-gray-600"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
