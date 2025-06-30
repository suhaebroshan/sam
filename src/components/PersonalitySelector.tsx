import { Bot, Briefcase, User, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface PersonalitySelectorProps {
  value: string;
  onChange: (personality: string) => void;
}

export function PersonalitySelector({
  value,
  onChange,
}: PersonalitySelectorProps) {
  const personalities = [
    {
      id: "sam",
      name: "SAM",
      description: "Unfiltered, sarcastic, real talk",
      icon: Bot,
      color: "text-red-400",
    },
    {
      id: "corporate",
      name: "Corporate",
      description: "Professional, polished responses",
      icon: Briefcase,
      color: "text-blue-400",
    },
    {
      id: "custom",
      name: "Custom",
      description: "Your personalized AI personality",
      icon: User,
      color: "text-purple-400",
    },
  ];

  const currentPersonality = personalities.find((p) => p.id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white h-8 gap-2"
        >
          {currentPersonality && (
            <currentPersonality.icon
              className={`w-4 h-4 ${currentPersonality.color}`}
            />
          )}
          <span className="text-sm">{currentPersonality?.name}</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 bg-gray-800 border-gray-600"
      >
        <div className="p-2">
          <div className="text-xs text-gray-400 mb-2 font-medium">
            PERSONALITY MODE
          </div>
          {personalities.map((personality) => (
            <DropdownMenuItem
              key={personality.id}
              onClick={() => onChange(personality.id)}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer ${
                value === personality.id ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              <personality.icon
                className={`w-5 h-5 mt-0.5 ${personality.color}`}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">
                    {personality.name}
                  </span>
                  {value === personality.id && (
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {personality.description}
                </p>
              </div>
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator className="bg-gray-600" />

        <div className="p-2">
          <div className="text-xs text-gray-400 p-2">
            Switch personalities anytime to change how I respond and interact
            with you.
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
