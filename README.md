# SAM.exe - Advanced AI Chatbot System

A production-ready, multi-user AI chatbot system with real-time sync, local-first architecture, and personality modes.

## 🚀 Features

### 👥 **Multi-User System**

- Email + password or username authentication
- SQLite database with user isolation
- Real-time sync across devices
- Support for 5-6 concurrent users

### 💬 **Advanced Chat Features**

- Create, rename, delete chats
- Full chat history per user
- Real-time typing indicators
- Message persistence in JSON files

### 🧠 **Smart Memory System**

- Auto-extract facts from conversations
- Explicit memory commands ("Remember that...")
- User-controlled memory management
- Personality preferences storage

### 🎭 **Personality Modes**

- **Corporate Mode**: Professional, polished responses
- **SAM Mode**: Unfiltered, sarcastic, Gen Z energy
- **Custom Mode**: User-defined personalities

### 🔄 **Real-Time Features**

- WebSocket connections
- Live typing indicators
- Instant chat sync
- Connection status monitoring

## 📁 **Project Structure**

```
sam-chatbot/
├── server/                 # Backend API server
│   ├── data/              # SQLite DB and user data
│   │   ├── users.db       # User authentication database
│   │   └── users/         # Per-user data directories
│   │       └── {username}/
│   │           ├── chats/ # Individual chat JSON files
│   │           └── memory.json
│   ├── index.js           # Express server with WebSocket
│   └── package.json       # Backend dependencies
├── src/                   # Frontend React app
│   ├── lib/
│   │   └── apiService.ts  # Real-time API client
│   ├── contexts/          # Enhanced contexts
│   │   ├── EnhancedAuthContext.tsx
│   │   ├── EnhancedChatContext.tsx
│   │   └── EnhancedMemoryContext.tsx
│   └── components/        # UI components
└── setup.js               # Automated setup script
```

## 🛠️ **Quick Setup**

### 1. **Run Setup Script**

```bash
# Install all dependencies and create directories
node setup.js
```

### 2. **Configure API Key**

```bash
# Edit server/.env file
cd server
# Add your OpenRouter API key:
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### 3. **Start Backend**

```bash
cd server
npm run dev
# Backend runs on http://localhost:3001
```

### 4. **Start Frontend**

```bash
# In new terminal, from project root
npm run dev
# Frontend runs on http://localhost:5173
```

## 🎯 **Usage**

### **Authentication**

- Register with username, email, password, display name
- Login with email/username + password
- Each user gets isolated data storage

### **Chat Management**

- Create new chats with personality modes
- Rename chats by clicking the edit button
- Delete chats with confirmation
- Switch between chats instantly

### **Memory System**

- SAM auto-learns from conversations
- Say "Remember that..." for explicit memories
- View/edit memories in profile section
- Delete unwanted memories anytime

### **Personality Modes**

- **Corporate**: "Thank you for your inquiry. Let me provide a comprehensive analysis..."
- **SAM**: "Yo wassup! Real talk, that's actually fire bro!"
- **Custom**: Define your own AI personality

## 🔧 **Development**

### **Backend API Endpoints**

```
POST /auth/register          # User registration
POST /auth/login            # User authentication
GET  /api/profile           # User profile
PUT  /api/profile           # Update profile
GET  /api/chats             # Get user chats
POST /api/chats             # Create new chat
GET  /api/chats/:id         # Get specific chat
PUT  /api/chats/:id         # Update chat
DELETE /api/chats/:id       # Delete chat
GET  /api/memory            # Get user memory
PUT  /api/memory            # Update memory
```

### **WebSocket Events**

```
authenticate                # Authenticate socket connection
join_chat / leave_chat      # Chat room management
typing_start / typing_stop  # Typing indicators
chat_created / chat_updated # Real-time chat sync
chat_deleted                # Chat deletion events
```

### **File Structure (Runtime)**

```
server/data/
├── users.db                # SQLite database
└── users/
    ├── suhaeb/
    │   ├── chats/
    │   │   ├── chat_123.json
    │   │   └── chat_456.json
    │   └── memory.json
    └── prakash/
        ├── chats/
        └── memory.json
```

## 🔒 **Security Features**

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on auth endpoints
- Input validation and sanitization
- User data isolation
- Session management

## 🌐 **Local-First Architecture**

- Works offline on local network
- No external cloud dependencies
- All data stored locally
- Real-time sync when connected
- Privacy-focused design

## 📊 **Performance**

- Supports 5-6 concurrent users
- SQLite for fast user queries
- JSON files for chat scalability
- WebSocket for real-time features
- Efficient memory management

## 🔮 **Future Enhancements**

- [ ] Custom personality mode editor
- [ ] Voice message support
- [ ] File sharing capabilities
- [ ] Chat export/import
- [ ] Advanced memory analytics
- [ ] Multi-language support
- [ ] Mobile app companion

## 🚨 **Troubleshooting**

### **Backend won't start**

```bash
# Check Node.js version (requires 16+)
node --version

# Reinstall dependencies
cd server && rm -rf node_modules && npm install
```

### **Database issues**

```bash
# Reset database (WARNING: deletes all data)
rm server/data/users.db
# Restart server to recreate
```

### **Connection issues**

- Ensure backend is running on port 3001
- Check firewall settings for local network
- Verify WebSocket connections in browser dev tools

## 📝 **License**

MIT License - Feel free to use this for your projects!

---

**Built with ❤️ for the SAM.exe ecosystem**

Real-time • Local-first • Privacy-focused • Production-ready
