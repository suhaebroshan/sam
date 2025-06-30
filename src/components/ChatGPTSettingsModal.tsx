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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Plus,
  Edit3,
  Brain,
  User,
  Bot,
  Bell,
  MessageCircle,
  Clock,
} from "lucide-react";
import { useMemory } from "@/contexts/ChatGPTMemoryContext";
import { useChatGPT } from "@/contexts/ChatGPTContext";
import { useProactiveMessaging } from "../hooks/useProactiveMessaging";
import { useNotifications } from "../hooks/useNotifications";
import { PROACTIVE_MESSAGE_FREQUENCIES } from "../types/customGPT";

interface ChatGPTSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatGPTSettingsModal({
  open,
  onOpenChange,
}: ChatGPTSettingsModalProps) {
  const { memory, addFact, removeFact, clearAllMemory } = useMemory();
  const {
    customPersonalities,
    saveCustomPersonality,
    deleteCustomPersonality,
  } = useChatGPT();
  const { settings, updateSettings, sendProactiveMessage } =
    useProactiveMessaging();
  const { requestPermission, checkPermission } = useNotifications();
  const [newFact, setNewFact] = useState("");
  const [editingPersonality, setEditingPersonality] = useState<any>(null);
  const [personalityForm, setPersonalityForm] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    tone: "casual",
    creativity: "balanced",
    formality: "informal",
  });

  const handleAddFact = () => {
    if (newFact.trim()) {
      addFact(newFact.trim());
      setNewFact("");
    }
  };

  const handleCreatePersonality = () => {
    setEditingPersonality(null);
    setPersonalityForm({
      name: "",
      description: "",
      systemPrompt: "",
      tone: "casual",
      creativity: "balanced",
      formality: "informal",
    });
  };

  const handleSavePersonality = () => {
    if (personalityForm.name.trim()) {
      const personality = {
        id: editingPersonality?.id || `custom_${Date.now()}`,
        ...personalityForm,
        createdAt: editingPersonality?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveCustomPersonality(personality);
      setEditingPersonality(null);
      setPersonalityForm({
        name: "",
        description: "",
        systemPrompt: "",
        tone: "casual",
        creativity: "balanced",
        formality: "informal",
      });
    }
  };

  const generateSystemPrompt = () => {
    const { tone, creativity, formality } = personalityForm;

    let prompt = `You are a custom AI personality with the following characteristics:\n\n`;

    prompt += `Tone: ${tone === "casual" ? "Casual and friendly" : tone === "professional" ? "Professional and formal" : "Energetic and enthusiastic"}\n`;
    prompt += `Creativity: ${creativity === "conservative" ? "Stick to facts and proven information" : creativity === "balanced" ? "Balance creativity with accuracy" : "Be highly creative and imaginative"}\n`;
    prompt += `Formality: ${formality === "formal" ? "Use formal language and structure" : formality === "informal" ? "Use casual language and conversational style" : "Mix formal and informal as appropriate"}\n\n`;

    prompt += `Adapt your responses to match these characteristics while being helpful and engaging.`;

    setPersonalityForm((prev) => ({ ...prev, systemPrompt: prompt }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-800 border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
          <DialogDescription className="text-gray-400">
            Manage your AI memory, personalities, and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="memory" className="flex-1">
          <TabsList className="grid w-full grid-cols-4 bg-gray-700">
            <TabsTrigger
              value="memory"
              className="data-[state=active]:bg-gray-600"
            >
              <Brain className="w-4 h-4 mr-2" />
              Memory
            </TabsTrigger>
            <TabsTrigger
              value="personalities"
              className="data-[state=active]:bg-gray-600"
            >
              <Bot className="w-4 h-4 mr-2" />
              Personalities
            </TabsTrigger>
            <TabsTrigger
              value="proactive"
              className="data-[state=active]:bg-gray-600"
            >
              <Bell className="w-4 h-4 mr-2" />
              Proactive
            </TabsTrigger>
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-gray-600"
            >
              <User className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
          </TabsList>

          {/* Memory Tab */}
          <TabsContent value="memory" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">AI Memory</h3>
                <p className="text-sm text-gray-400 mb-4">
                  These are facts the AI remembers about you. Add, edit, or
                  remove items as needed.
                </p>
              </div>

              {/* Add New Fact */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new fact about yourself..."
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddFact()}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  onClick={handleAddFact}
                  size="icon"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Memory List */}
              <ScrollArea className="h-64 border border-gray-600 rounded-lg p-4 bg-gray-700">
                {memory?.facts && memory.facts.length > 0 ? (
                  <div className="space-y-2">
                    {memory.facts.map((fact, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-600 rounded-lg group"
                      >
                        <div className="flex-1 text-sm">{fact}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFact(index)}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No memories yet</p>
                    <p className="text-xs">Add facts about yourself above</p>
                  </div>
                )}
              </ScrollArea>

              {memory?.facts && memory.facts.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={clearAllMemory}
                  className="w-full"
                >
                  Clear All Memory
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Personalities Tab */}
          <TabsContent value="personalities" className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">Custom Personalities</h3>
                  <p className="text-sm text-gray-400">
                    Create and manage custom AI personalities
                  </p>
                </div>
                <Button
                  onClick={handleCreatePersonality}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </div>

              {/* Personality List */}
              <ScrollArea className="h-48 border border-gray-600 rounded-lg p-4 bg-gray-700 mb-4">
                {customPersonalities.length > 0 ? (
                  <div className="space-y-2">
                    {customPersonalities.map((personality) => (
                      <div
                        key={personality.id}
                        className="flex items-center gap-3 p-3 bg-gray-600 rounded-lg group"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{personality.name}</div>
                          <div className="text-sm text-gray-400">
                            {personality.description}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingPersonality(personality);
                            setPersonalityForm(personality);
                          }}
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            deleteCustomPersonality(personality.id)
                          }
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No custom personalities yet</p>
                  </div>
                )}
              </ScrollArea>

              {/* Personality Editor */}
              {(editingPersonality !== null || personalityForm.name) && (
                <div className="border border-gray-600 rounded-lg p-4 bg-gray-700 space-y-4">
                  <h4 className="font-medium">
                    {editingPersonality ? "Edit" : "Create"} Personality
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={personalityForm.name}
                        onChange={(e) =>
                          setPersonalityForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Personality name"
                        className="bg-gray-600 border-gray-500"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={personalityForm.description}
                        onChange={(e) =>
                          setPersonalityForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Brief description"
                        className="bg-gray-600 border-gray-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Tone</Label>
                      <select
                        value={personalityForm.tone}
                        onChange={(e) =>
                          setPersonalityForm((prev) => ({
                            ...prev,
                            tone: e.target.value,
                          }))
                        }
                        className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                      >
                        <option value="casual">Casual</option>
                        <option value="professional">Professional</option>
                        <option value="enthusiastic">Enthusiastic</option>
                      </select>
                    </div>
                    <div>
                      <Label>Creativity</Label>
                      <select
                        value={personalityForm.creativity}
                        onChange={(e) =>
                          setPersonalityForm((prev) => ({
                            ...prev,
                            creativity: e.target.value,
                          }))
                        }
                        className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                      >
                        <option value="conservative">Conservative</option>
                        <option value="balanced">Balanced</option>
                        <option value="creative">Creative</option>
                      </select>
                    </div>
                    <div>
                      <Label>Formality</Label>
                      <select
                        value={personalityForm.formality}
                        onChange={(e) =>
                          setPersonalityForm((prev) => ({
                            ...prev,
                            formality: e.target.value,
                          }))
                        }
                        className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                      >
                        <option value="formal">Formal</option>
                        <option value="informal">Informal</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label>System Prompt</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateSystemPrompt}
                        className="text-xs"
                      >
                        Generate
                      </Button>
                    </div>
                    <Textarea
                      value={personalityForm.systemPrompt}
                      onChange={(e) =>
                        setPersonalityForm((prev) => ({
                          ...prev,
                          systemPrompt: e.target.value,
                        }))
                      }
                      placeholder="Describe how the AI should behave..."
                      className="bg-gray-600 border-gray-500 min-h-[100px]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSavePersonality}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {editingPersonality ? "Update" : "Create"} Personality
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingPersonality(null);
                        setPersonalityForm({
                          name: "",
                          description: "",
                          systemPrompt: "",
                          tone: "casual",
                          creativity: "balanced",
                          formality: "informal",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Proactive Messaging Tab */}
          <TabsContent value="proactive" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-4">
                📲 Proactive Messaging
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Let the AI send you random messages and notifications. Get
                notified when the AI wants to chat!
              </p>

              <div className="space-y-6">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium">Enable Proactive Messages</h4>
                    <p className="text-sm text-gray-400">
                      Allow AI to send you random messages and notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(enabled) => {
                      if (enabled && !checkPermission()) {
                        requestPermission().then((granted) => {
                          if (granted) {
                            updateSettings({ enabled: true });
                          }
                        });
                      } else {
                        updateSettings({ enabled });
                      }
                    }}
                  />
                </div>

                {/* Frequency Settings */}
                {settings.enabled && (
                  <>
                    <div className="p-4 bg-gray-700 rounded-lg space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Message Frequency
                      </h4>
                      <Select
                        value={settings.frequency}
                        onValueChange={(frequency: any) =>
                          updateSettings({ frequency })
                        }
                      >
                        <SelectTrigger className="bg-gray-600 border-gray-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {Object.entries(PROACTIVE_MESSAGE_FREQUENCIES).map(
                            ([key, config]) => (
                              <SelectItem
                                key={key}
                                value={key}
                                className="text-white hover:bg-gray-700"
                              >
                                {config.label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quiet Hours */}
                    <div className="p-4 bg-gray-700 rounded-lg space-y-4">
                      <h4 className="font-medium">Quiet Hours</h4>
                      <p className="text-sm text-gray-400">
                        Set times when you don't want to receive messages
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={settings.quietHours.start}
                            onChange={(e) =>
                              updateSettings({
                                quietHours: {
                                  ...settings.quietHours,
                                  start: e.target.value,
                                },
                              })
                            }
                            className="bg-gray-600 border-gray-500"
                          />
                        </div>
                        <div>
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={settings.quietHours.end}
                            onChange={(e) =>
                              updateSettings({
                                quietHours: {
                                  ...settings.quietHours,
                                  end: e.target.value,
                                },
                              })
                            }
                            className="bg-gray-600 border-gray-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="p-4 bg-gray-700 rounded-lg space-y-2">
                      <h4 className="font-medium">Statistics</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Total Sent:</span>
                          <span className="ml-2 font-medium">
                            {settings.totalSent}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Last Sent:</span>
                          <span className="ml-2 font-medium">
                            {settings.lastSent
                              ? new Date(settings.lastSent).toLocaleString()
                              : "Never"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Test Message */}
                    <div className="p-4 bg-gray-700 rounded-lg space-y-3">
                      <h4 className="font-medium mb-2">Test Notification</h4>
                      <p className="text-sm text-gray-400">
                        Send a test proactive message to check if everything
                        works
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            console.log("Testing notification...");
                            const success = await sendProactiveMessage(
                              "sam",
                              "This is a test message! 👋",
                            );
                            console.log("Test message result:", success);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Send Test Message
                        </Button>
                        <Button
                          onClick={async () => {
                            console.log("Testing notification permission...");
                            const granted = await requestPermission();
                            console.log("Permission result:", granted);
                          }}
                          variant="outline"
                          className="text-white border-gray-600"
                        >
                          <Bell className="w-4 h-4 mr-2" />
                          Test Permission
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Permission Status */}
                {!checkPermission() && (
                  <div className="p-4 bg-yellow-900/50 border border-yellow-600 rounded-lg">
                    <h4 className="font-medium text-yellow-400 mb-2">
                      Notification Permission Required
                    </h4>
                    <p className="text-sm text-yellow-200 mb-3">
                      To receive proactive messages, please allow notifications
                      in your browser.
                    </p>
                    <Button
                      onClick={requestPermission}
                      variant="outline"
                      className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/30"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Enable Notifications
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-4">General Settings</h3>

              <div className="space-y-4">
                <div className="p-4 bg-gray-700 rounded-lg">
                  <h4 className="font-medium mb-2">Data Storage</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    All your data is stored locally on your device for privacy.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline">Export Data</Button>
                    <Button variant="outline">Import Data</Button>
                  </div>
                </div>

                <div className="p-4 bg-gray-700 rounded-lg">
                  <h4 className="font-medium mb-2">API Settings</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    Model: nvidia/llama-3.1-nemotron-ultra-253b-v1:free
                  </p>
                  <Badge
                    variant="outline"
                    className="text-green-400 border-green-400"
                  >
                    Connected
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
