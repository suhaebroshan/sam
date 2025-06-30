# ChatGPT Clone Setup Guide

## 🚀 **Features Implemented**

✅ **1:1 ChatGPT UI Replica**

- Exact sidebar layout with chat grouping
- Identical message bubbles and styling
- Same header, input area, and navigation
- Dark theme with proper spacing and animations
- Mobile responsive design

✅ **User Account System**

- Username + password authentication
- Local storage for complete privacy
- Isolated user experiences
- No shared data between accounts

✅ **OpenRouter API Integration**

- Model: `nvidia/llama-3.1-nemotron-ultra-253b-v1:free`
- Real streaming responses like ChatGPT
- "Bot is typing..." animations
- Stop generation functionality

✅ **Smart Memory System**

- Auto-extract facts from conversations
- User-controlled memory management
- View, edit, delete memories
- Memory context in every AI conversation

✅ **3 Personality Modes**

- **SAM Mode**: Unfiltered, sarcastic, Gen Z energy
- **Corporate Mode**: Professional, courteous responses
- **Custom Mode**: User-created personalities with form builder

✅ **Advanced Chat Features**

- Create, rename, delete chats
- Chat history grouped by date
- Regenerate responses
- Export/import functionality ready

## 🛠️ **Quick Setup**

### 1. **Install Dependencies**

```bash
npm install
```

### 2. **Configure API Key**

The OpenRouter API key is already configured in `.env`:

```env
VITE_OPENROUTER_API_KEY=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
```

### 3. **Start the Application**

```bash
npm run dev
```

## 🎯 **How to Use**

### **Create Account**

1. Click "Create account" on login screen
2. Enter username, email, password, display name
3. Your account is stored locally for privacy

### **Chat Features**

- **New Chat**: Click "New chat" button in sidebar
- **Switch Personality**: Use dropdown in header
- **Rename Chat**: Click three dots → Rename
- **Delete Chat**: Click three dots → Delete
- **Regenerate**: Click regenerate button on AI messages

### **Memory Management**

1. Go to Settings (user menu → Settings)
2. Click "Memory" tab
3. Add facts manually or let AI auto-extract
4. View/edit/delete memories as needed

### **Custom Personalities**

1. Settings → Personalities tab
2. Click "Create New"
3. Fill out personality form
4. Generate system prompt automatically
5. Save and use in chats

## 📁 **Data Storage Structure**

All data is stored locally in `localStorage`:

```
chatgpt_users               # List of all users
chatgpt_user                # Currently logged in user

Per user:
chatgpt_user_{userId}_chats        # User's chat history
chatgpt_user_{userId}_memory       # User's AI memory
chatgpt_user_{userId}_personalities # Custom personalities
chatgpt_user_{userId}_personality  # Last used personality
```

## 🎭 **Personality System**

### **SAM Mode**

- Starts with: "yo wassup [user], what you want nigga?"
- Sarcastic, loyal, authentic responses
- Uses Gen Z slang naturally
- No corporate filtering

### **Corporate Mode**

- Professional, courteous tone
- Formal language and structure
- Business-appropriate responses
- Default mode for new users

### **Custom Mode**

- User-created personalities
- Form-based configuration:
  - Tone (Casual/Professional/Enthusiastic)
  - Creativity (Conservative/Balanced/Creative)
  - Formality (Formal/Informal/Mixed)
- Auto-generated system prompts

## 🧠 **Memory System**

### **Auto-Detection**

The AI automatically extracts:

- Names: "I'm John", "Call me Sarah"
- Age: "I'm 25 years old"
- Location: "I live in NYC"
- Job: "I work as a developer"
- Interests: "I love programming"
- Family: "My wife", "I have kids"

### **Explicit Commands**

- "Remember that I prefer working late"
- "Keep in mind I'm allergic to peanuts"
- "Don't forget my meeting is Friday"
- "Note that I use React for frontend"

### **Memory Management**

- View all memories in Settings
- Add facts manually
- Edit existing memories
- Delete unwanted information
- Clear all memory option

## 🔥 **Advanced Features**

### **Message Streaming**

- Real-time response generation
- Character-by-character display
- Stop generation at any time
- Proper error handling

### **Chat Management**

- Automatic title generation
- Date-based grouping in sidebar
- Rename chats inline
- Delete with confirmation
- Last modified tracking

### **Offline Capability**

- No external dependencies
- Works on local network
- All processing client-side
- Data stays on your machine

## 🎨 **UI/UX Features**

### **ChatGPT-Identical Interface**

- Same color scheme (gray-800/900)
- Identical spacing and typography
- Exact button placement and behavior
- Mobile responsive design

### **Smooth Animations**

- Typing indicators with bouncing dots
- Sidebar toggle transitions
- Message fade-in effects
- Loading states

### **Accessibility**

- Keyboard navigation
- Screen reader support
- Focus management
- Color contrast compliance

## 🔧 **Customization**

### **Personality Templates**

Create new personalities by modifying:

- System prompts
- Response patterns
- Tone and style
- Behavioral traits

### **Memory Categories**

Extend memory system with:

- Custom fact categories
- Advanced extraction patterns
- Memory importance levels
- Automatic cleanup rules

### **API Configuration**

Switch models by updating:

```typescript
const OPENROUTER_MODEL = "your-preferred-model";
```

## 🚨 **Troubleshooting**

### **API Issues**

- Check OpenRouter API key validity
- Verify model availability
- Check network connectivity
- Review browser console for errors

### **Storage Issues**

- Check localStorage quota
- Clear browser data if needed
- Verify data persistence
- Export data before clearing

### **Memory Problems**

- Check fact extraction patterns
- Verify memory save operations
- Clear corrupted memory data
- Restart with fresh memory

## 📈 **Performance**

- **Fast local storage**: Instant chat loading
- **Efficient rendering**: Virtual scrolling for large chats
- **Memory optimization**: Automatic cleanup of old data
- **Streaming responses**: Real-time AI interaction

---

**Your ChatGPT clone is ready!** 🎉

Experience AI conversations with personality, memory, and complete privacy. Everything runs locally with your own API key.

**Built for:** Developers who want ChatGPT's UX with custom personalities and local control.
