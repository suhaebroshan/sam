import { Bot, Lightbulb, Code, MessageCircle, Sparkles } from "lucide-react";
import { useChatGPT } from "@/contexts/ChatGPTContext";
import { useAuth } from "@/contexts/ChatGPTAuthContext";

interface ChatGPTWelcomeProps {
  onStartChat: (prompt: string) => void;
}

export function ChatGPTWelcome({ onStartChat }: ChatGPTWelcomeProps) {
  const { user } = useAuth();
  const { currentPersonality } = useChatGPT();

  const getWelcomeMessage = () => {
    switch (currentPersonality) {
      case "sam":
        return {
          title: "Yo, what's good?",
          subtitle: `Hey ${user?.displayName || "bro"}, SAM's here and ready to keep it 100. What you need?`,
          examples: [
            "Help me roast my business idea",
            "What's your take on this code?",
            "Give me some real advice, no BS",
            "What would you do in my situation?",
          ],
        };
      case "corporate":
        return {
          title: "How can I help you today?",
          subtitle: `Hello ${user?.displayName || "there"}, I'm SAM in corporate mode - here to assist you with professional and thoughtful responses.`,
          examples: [
            "Draft a business proposal",
            "Explain a complex concept",
            "Help me write an email",
            "Analyze this data for insights",
          ],
        };
      default:
        return {
          title: "Ready to chat?",
          subtitle: `Hi ${user?.displayName || "there"}, let's have a conversation tailored to your preferences.`,
          examples: [
            "Tell me about yourself",
            "What can you help me with?",
            "Let's discuss something interesting",
            "Show me what you can do",
          ],
        };
    }
  };

  const welcome = getWelcomeMessage();

  const capabilities = [
    {
      icon: MessageCircle,
      title: "Conversational",
      description: "Engage in natural, flowing conversations",
    },
    {
      icon: Lightbulb,
      title: "Creative",
      description: "Generate ideas, stories, and creative content",
    },
    {
      icon: Code,
      title: "Technical",
      description: "Help with coding, debugging, and explanations",
    },
    {
      icon: Sparkles,
      title: "Adaptive",
      description: "Adjust personality based on your preferences",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Main Welcome */}
      <div className="mb-12">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
            currentPersonality === "sam"
              ? "bg-red-500"
              : currentPersonality === "corporate"
                ? "bg-blue-500"
                : "bg-purple-500"
          }`}
        >
          <Bot className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">{welcome.title}</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          {welcome.subtitle}
        </p>
      </div>

      {/* Example Prompts */}
      <div className="w-full max-w-4xl mb-12">
        <h2 className="text-lg font-semibold text-white mb-6">
          Here are some ideas to get started:
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {welcome.examples.map((example, index) => (
            <button
              key={index}
              onClick={() => onStartChat(example)}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors text-left group"
            >
              <div className="text-white group-hover:text-blue-300 transition-colors">
                {example}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Capabilities */}
      <div className="w-full max-w-4xl">
        <h2 className="text-lg font-semibold text-white mb-6">Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {capabilities.map((capability, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-4"
            >
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mb-3">
                <capability.icon className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="text-white font-medium mb-2">
                {capability.title}
              </h3>
              <p className="text-gray-400 text-sm">{capability.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-12 text-center text-gray-400 text-sm max-w-2xl">
        <p>
          Your conversations are private and stored locally on your device.{" "}
          {currentPersonality === "sam" && (
            <span className="text-red-400">
              SAM mode is unfiltered - expect authentic, direct responses.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
