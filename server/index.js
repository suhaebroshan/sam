const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const fs = require("fs-extra");
const path = require("path");
const rateLimit = require("express-rate-limit");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: "Too many authentication attempts" },
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: "Rate limit exceeded" },
});

app.use("/auth", authLimiter);
app.use("/api", apiLimiter);

// Initialize database and directories
const DB_PATH = path.join(__dirname, "data", "users.db");
const USERS_DIR = path.join(__dirname, "data", "users");

// Ensure directories exist
fs.ensureDirSync(path.dirname(DB_PATH));
fs.ensureDirSync(USERS_DIR);

// Initialize SQLite database
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      is_active BOOLEAN DEFAULT 1,
      personality_mode TEXT DEFAULT 'corporate',
      default_model TEXT DEFAULT 'gpt-4o'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_token TEXT UNIQUE,
      socket_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);
});

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || "sam_jwt_secret_key_2024";

// Connected users tracking
const connectedUsers = new Map();

// Utility functions
const getUserDataPath = (username) => path.join(USERS_DIR, username);
const getChatPath = (username, chatId) =>
  path.join(getUserDataPath(username), "chats", `${chatId}.json`);
const getMemoryPath = (username) =>
  path.join(getUserDataPath(username), "memory.json");

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Initialize user directory structure
const initUserDirectories = async (username) => {
  const userPath = getUserDataPath(username);
  await fs.ensureDir(path.join(userPath, "chats"));

  // Initialize memory file if it doesn't exist
  const memoryPath = getMemoryPath(username);
  if (!(await fs.pathExists(memoryPath))) {
    await fs.writeJSON(memoryPath, {
      facts: [],
      personality_preferences: {},
      last_updated: new Date().toISOString(),
    });
  }
};

// AUTH ROUTES
app.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password || !displayName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    db.run(
      `INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)`,
      [username.toLowerCase(), email.toLowerCase(), passwordHash, displayName],
      async function (err) {
        if (err) {
          if (err.message.includes("UNIQUE constraint failed")) {
            if (err.message.includes("username")) {
              return res.status(400).json({ error: "Username already exists" });
            } else {
              return res.status(400).json({ error: "Email already exists" });
            }
          }
          return res.status(500).json({ error: "Registration failed" });
        }

        // Initialize user directories
        await initUserDirectories(username.toLowerCase());

        const token = jwt.sign(
          {
            id: this.lastID,
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            displayName,
          },
          JWT_SECRET,
          { expiresIn: "7d" },
        );

        res.status(201).json({
          token,
          user: {
            id: this.lastID,
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            displayName,
            personalityMode: "corporate",
            defaultModel: "gpt-4o",
          },
        });
      },
    );
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/auth/login", (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ error: "Identifier and password are required" });
    }

    const query = `
      SELECT * FROM users 
      WHERE (email = ? OR username = ?) AND is_active = 1
    `;

    db.get(
      query,
      [identifier.toLowerCase(), identifier.toLowerCase()],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: "Login failed" });
        }

        if (!user) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        const isValidPassword = await bcrypt.compare(
          password,
          user.password_hash,
        );

        if (!isValidPassword) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Update last login
        db.run("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [
          user.id,
        ]);

        // Ensure user directories exist
        await initUserDirectories(user.username);

        const token = jwt.sign(
          {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.display_name,
          },
          JWT_SECRET,
          { expiresIn: "7d" },
        );

        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.display_name,
            personalityMode: user.personality_mode,
            defaultModel: user.default_model,
          },
        });
      },
    );
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// USER PROFILE ROUTES
app.get("/api/profile", authenticateToken, (req, res) => {
  db.get("SELECT * FROM users WHERE id = ?", [req.user.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      personalityMode: user.personality_mode,
      defaultModel: user.default_model,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    });
  });
});

app.put("/api/profile", authenticateToken, (req, res) => {
  const { displayName, personalityMode, defaultModel } = req.body;

  db.run(
    `UPDATE users SET display_name = ?, personality_mode = ?, default_model = ? WHERE id = ?`,
    [displayName, personalityMode, defaultModel, req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to update profile" });
      }
      res.json({ message: "Profile updated successfully" });
    },
  );
});

// CHAT ROUTES
app.get("/api/chats", authenticateToken, async (req, res) => {
  try {
    const chatsDir = path.join(getUserDataPath(req.user.username), "chats");
    await fs.ensureDir(chatsDir);

    const chatFiles = await fs.readdir(chatsDir);
    const chats = [];

    for (const file of chatFiles) {
      if (file.endsWith(".json")) {
        try {
          const chatPath = path.join(chatsDir, file);
          const chatData = await fs.readJSON(chatPath);
          chats.push(chatData);
        } catch (error) {
          console.error(`Error reading chat file ${file}:`, error);
        }
      }
    }

    // Sort by last modified
    chats.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: "Failed to load chats" });
  }
});

app.post("/api/chats", authenticateToken, async (req, res) => {
  try {
    const { title = "New Chat", personalityMode = "corporate" } = req.body;

    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const chat = {
      id: chatId,
      title,
      personalityMode,
      messages: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      userId: req.user.id,
      username: req.user.username,
    };

    const chatPath = getChatPath(req.user.username, chatId);
    await fs.ensureDir(path.dirname(chatPath));
    await fs.writeJSON(chatPath, chat);

    // Broadcast to user's connected clients
    const userSockets = connectedUsers.get(req.user.username);
    if (userSockets) {
      userSockets.forEach((socketId) => {
        io.to(socketId).emit("chat_created", chat);
      });
    }

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ error: "Failed to create chat" });
  }
});

app.get("/api/chats/:chatId", authenticateToken, async (req, res) => {
  try {
    const chatPath = getChatPath(req.user.username, req.params.chatId);

    if (!(await fs.pathExists(chatPath))) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const chat = await fs.readJSON(chatPath);
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: "Failed to load chat" });
  }
});

app.put("/api/chats/:chatId", authenticateToken, async (req, res) => {
  try {
    const chatPath = getChatPath(req.user.username, req.params.chatId);

    if (!(await fs.pathExists(chatPath))) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const chat = await fs.readJSON(chatPath);
    const updates = req.body;

    // Merge updates
    Object.assign(chat, updates, {
      lastModified: new Date().toISOString(),
    });

    await fs.writeJSON(chatPath, chat);

    // Broadcast to user's connected clients
    const userSockets = connectedUsers.get(req.user.username);
    if (userSockets) {
      userSockets.forEach((socketId) => {
        io.to(socketId).emit("chat_updated", chat);
      });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: "Failed to update chat" });
  }
});

app.delete("/api/chats/:chatId", authenticateToken, async (req, res) => {
  try {
    const chatPath = getChatPath(req.user.username, req.params.chatId);

    if (!(await fs.pathExists(chatPath))) {
      return res.status(404).json({ error: "Chat not found" });
    }

    await fs.remove(chatPath);

    // Broadcast to user's connected clients
    const userSockets = connectedUsers.get(req.user.username);
    if (userSockets) {
      userSockets.forEach((socketId) => {
        io.to(socketId).emit("chat_deleted", { id: req.params.chatId });
      });
    }

    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete chat" });
  }
});

// MEMORY ROUTES
app.get("/api/memory", authenticateToken, async (req, res) => {
  try {
    const memoryPath = getMemoryPath(req.user.username);

    if (!(await fs.pathExists(memoryPath))) {
      await fs.writeJSON(memoryPath, {
        facts: [],
        personality_preferences: {},
        last_updated: new Date().toISOString(),
      });
    }

    const memory = await fs.readJSON(memoryPath);
    res.json(memory);
  } catch (error) {
    res.status(500).json({ error: "Failed to load memory" });
  }
});

app.put("/api/memory", authenticateToken, async (req, res) => {
  try {
    const memoryPath = getMemoryPath(req.user.username);
    const updates = req.body;

    const memory = {
      ...updates,
      last_updated: new Date().toISOString(),
    };

    await fs.writeJSON(memoryPath, memory);
    res.json(memory);
  } catch (error) {
    res.status(500).json({ error: "Failed to update memory" });
  }
});

// WebSocket handling
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("authenticate", (token) => {
    try {
      const user = jwt.verify(token, JWT_SECRET);
      socket.userId = user.id;
      socket.username = user.username;

      // Track connected users
      if (!connectedUsers.has(user.username)) {
        connectedUsers.set(user.username, new Set());
      }
      connectedUsers.get(user.username).add(socket.id);

      socket.emit("authenticated", { user });
      console.log(`User authenticated: ${user.username} (${socket.id})`);
    } catch (error) {
      socket.emit("auth_error", { error: "Invalid token" });
    }
  });

  socket.on("join_chat", (chatId) => {
    socket.join(`chat_${chatId}`);
  });

  socket.on("leave_chat", (chatId) => {
    socket.leave(`chat_${chatId}`);
  });

  socket.on("typing_start", (data) => {
    socket.to(`chat_${data.chatId}`).emit("user_typing", {
      username: socket.username,
      chatId: data.chatId,
    });
  });

  socket.on("typing_stop", (data) => {
    socket.to(`chat_${data.chatId}`).emit("user_stop_typing", {
      username: socket.username,
      chatId: data.chatId,
    });
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      const userSockets = connectedUsers.get(socket.username);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(socket.username);
        }
      }
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    connectedUsers: connectedUsers.size,
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 SAM Server running on http://localhost:${PORT}`);
  console.log(`📁 Data directory: ${path.resolve(USERS_DIR)}`);
  console.log(`🗄️  Database: ${path.resolve(DB_PATH)}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  db.close();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
