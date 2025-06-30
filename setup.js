#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Setting up SAM.exe Backend...\n");

// Check if Node.js version is adequate
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);

if (majorVersion < 16) {
  console.error("❌ Node.js version 16 or higher is required");
  console.error(`   Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Create necessary directories
const dataDir = path.join(__dirname, "server", "data");
const usersDir = path.join(dataDir, "users");

console.log("📁 Creating data directories...");
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(usersDir, { recursive: true });
console.log(`   Created: ${dataDir}`);
console.log(`   Created: ${usersDir}`);

// Install backend dependencies
console.log("\n📦 Installing backend dependencies...");
try {
  process.chdir(path.join(__dirname, "server"));
  execSync("npm install", { stdio: "inherit" });
  console.log("✅ Backend dependencies installed");
} catch (error) {
  console.error("❌ Failed to install backend dependencies");
  console.error(error.message);
  process.exit(1);
}

// Install frontend dependencies (if package.json exists in root)
const rootPackageJson = path.join(__dirname, "package.json");
if (fs.existsSync(rootPackageJson)) {
  console.log("\n📦 Installing frontend dependencies...");
  try {
    process.chdir(__dirname);
    execSync("npm install", { stdio: "inherit" });
    console.log("✅ Frontend dependencies installed");
  } catch (error) {
    console.error("❌ Failed to install frontend dependencies");
    console.error(error.message);
    process.exit(1);
  }
}

// Create environment file template
const envPath = path.join(__dirname, "server", ".env");
if (!fs.existsSync(envPath)) {
  console.log("\n📝 Creating environment file...");
  const envContent = `# SAM.exe Backend Configuration
PORT=3001
JWT_SECRET=sam_jwt_secret_key_2024_change_this_in_production
NODE_ENV=development

# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Database Configuration
DB_PATH=./data/users.db
USERS_DATA_PATH=./data/users
`;

  fs.writeFileSync(envPath, envContent);
  console.log(`   Created: ${envPath}`);
  console.log("   ⚠️  Please update your OpenRouter API key in .env");
}

console.log("\n🎉 Setup complete!");
console.log("\n📋 Next steps:");
console.log("   1. Update your OpenRouter API key in server/.env");
console.log("   2. Start the backend: cd server && npm run dev");
console.log("   3. Start the frontend: npm run dev");
console.log("   4. Open http://localhost:5173 in your browser");
console.log("\n💡 The backend will run on http://localhost:3001");
console.log("   Database and user data will be stored in server/data/");
console.log("\n🔥 Ready to chat with SAM!");
