import { io, Socket } from "socket.io-client";

export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  personalityMode: "sam" | "corporate" | "custom";
  defaultModel: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface Chat {
  id: string;
  title: string;
  personalityMode: "sam" | "corporate" | "custom";
  messages: ChatMessage[];
  createdAt: string;
  lastModified: string;
  userId: number;
  username: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  personalityMode?: string;
}

export interface UserMemory {
  facts: string[];
  personality_preferences: Record<string, any>;
  last_updated: string;
}

class APIService {
  private baseURL = "http://localhost:3001";
  private token: string | null = null;
  private socket: Socket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.token = localStorage.getItem("sam_token");
    if (this.token) {
      this.initializeSocket();
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private initializeSocket() {
    if (this.socket?.connected) return;

    this.socket = io(this.baseURL, {
      autoConnect: false,
    });

    this.socket.on("connect", () => {
      console.log("🔌 Connected to SAM server");
      if (this.token) {
        this.socket?.emit("authenticate", this.token);
      }
    });

    this.socket.on("authenticated", (data) => {
      console.log("✅ Authenticated with server", data.user);
      this.emit("authenticated", data.user);
    });

    this.socket.on("auth_error", (data) => {
      console.error("❌ Authentication failed:", data.error);
      this.logout();
    });

    this.socket.on("chat_created", (chat) => {
      this.emit("chat_created", chat);
    });

    this.socket.on("chat_updated", (chat) => {
      this.emit("chat_updated", chat);
    });

    this.socket.on("chat_deleted", (data) => {
      this.emit("chat_deleted", data);
    });

    this.socket.on("user_typing", (data) => {
      this.emit("user_typing", data);
    });

    this.socket.on("user_stop_typing", (data) => {
      this.emit("user_stop_typing", data);
    });

    this.socket.on("disconnect", () => {
      console.log("🔌 Disconnected from SAM server");
      this.emit("disconnected");
    });

    this.socket.connect();
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  // Authentication
  async register(userData: {
    username: string;
    email: string;
    password: string;
    displayName: string;
  }): Promise<{ token: string; user: User }> {
    const response = await this.request<{ token: string; user: User }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(userData),
      },
    );

    this.token = response.token;
    localStorage.setItem("sam_token", this.token);
    this.initializeSocket();

    return response;
  }

  async login(credentials: {
    identifier: string;
    password: string;
  }): Promise<{ token: string; user: User }> {
    const response = await this.request<{ token: string; user: User }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      },
    );

    this.token = response.token;
    localStorage.setItem("sam_token", this.token);
    this.initializeSocket();

    return response;
  }

  logout() {
    this.token = null;
    localStorage.removeItem("sam_token");
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.emit("logged_out");
  }

  // User Profile
  async getProfile(): Promise<User> {
    return this.request<User>("/api/profile");
  }

  async updateProfile(updates: Partial<User>): Promise<{ message: string }> {
    return this.request<{ message: string }>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  // Chats
  async getChats(): Promise<Chat[]> {
    return this.request<Chat[]>("/api/chats");
  }

  async createChat(chatData: {
    title?: string;
    personalityMode?: string;
  }): Promise<Chat> {
    return this.request<Chat>("/api/chats", {
      method: "POST",
      body: JSON.stringify(chatData),
    });
  }

  async getChat(chatId: string): Promise<Chat> {
    return this.request<Chat>(`/api/chats/${chatId}`);
  }

  async updateChat(chatId: string, updates: Partial<Chat>): Promise<Chat> {
    return this.request<Chat>(`/api/chats/${chatId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteChat(chatId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/chats/${chatId}`, {
      method: "DELETE",
    });
  }

  // Memory
  async getMemory(): Promise<UserMemory> {
    return this.request<UserMemory>("/api/memory");
  }

  async updateMemory(memory: UserMemory): Promise<UserMemory> {
    return this.request<UserMemory>("/api/memory", {
      method: "PUT",
      body: JSON.stringify(memory),
    });
  }

  // Real-time features
  joinChat(chatId: string) {
    this.socket?.emit("join_chat", chatId);
  }

  leaveChat(chatId: string) {
    this.socket?.emit("leave_chat", chatId);
  }

  startTyping(chatId: string) {
    this.socket?.emit("typing_start", { chatId });
  }

  stopTyping(chatId: string) {
    this.socket?.emit("typing_stop", { chatId });
  }

  // Connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Health check
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    connectedUsers: number;
  }> {
    return this.request<{
      status: string;
      timestamp: string;
      connectedUsers: number;
    }>("/health");
  }
}

export const apiService = new APIService();
export default apiService;
