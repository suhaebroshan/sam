import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/ChatGPTAuthContext";
import { MemoryProvider } from "@/contexts/ChatGPTMemoryContext";
import { ChatProvider } from "@/contexts/ChatGPTContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ChatGPTInterface } from "@/components/ChatGPTInterface";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  return (
    <AuthProvider>
      <MemoryProvider>
        <ChatProvider>
          <ChatGPTInterface />
        </ChatProvider>
      </MemoryProvider>
    </AuthProvider>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
