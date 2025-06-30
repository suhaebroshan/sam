import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Bot,
  MoreHorizontal,
  MessageSquare,
  Edit3,
  Trash2,
  Power,
  PowerOff,
} from "lucide-react";
import { CustomGPT } from "../types/customGPT";

interface CustomGPTCardProps {
  gpt: CustomGPT;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  chatCount?: number;
}

export function CustomGPTCard({
  gpt,
  isActive,
  onSelect,
  onEdit,
  onDelete,
  onToggleActive,
  chatCount = 0,
}: CustomGPTCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`group relative rounded-lg transition-all cursor-pointer ${
        isActive
          ? "bg-gray-800 border border-gray-600"
          : "hover:bg-gray-800 border border-transparent"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3 p-3">
        {/* GPT Avatar */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
          style={{
            backgroundColor: gpt.colorTheme?.primary || "#3B82F6",
          }}
        >
          <Bot className="w-4 h-4 text-white" />
        </div>

        {/* GPT Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-white truncate">
              {gpt.name}
            </h4>
            {gpt.isActive && (
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: gpt.colorTheme?.accent || "#60A5FA",
                }}
              />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-400 truncate">
              {gpt.description || "Custom GPT"}
            </p>
            {chatCount > 0 && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {chatCount}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 text-gray-400 hover:text-white transition-opacity ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
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
                onToggleActive();
              }}
              className="text-white hover:bg-gray-700"
            >
              {gpt.isActive ? (
                <>
                  <PowerOff className="w-4 h-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <Power className="w-4 h-4 mr-2" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-600" />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-white hover:bg-gray-700"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-red-400 hover:bg-gray-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active indicator bar */}
      {isActive && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
          style={{
            backgroundColor: gpt.colorTheme?.primary || "#3B82F6",
          }}
        />
      )}
    </div>
  );
}
