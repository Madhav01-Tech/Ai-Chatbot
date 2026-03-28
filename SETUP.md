# QuickChat - Complete Setup Guide

This guide will help you connect the frontend and backend and run the QuickChat AI application.

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **MongoDB** (connection URI already configured in `.env`)
- **Git** (optional)

## Project Structure

```
QuickChat/
├── Backend/           # Express.js server
│   ├── src/
│   ├── index.js
│   ├── package.json
│   └── .env
└── frontend/          # React + Vite application
    ├── src/
    ├── package.json
    └── .env.local
```

## Backend Setup

### 1. Install Dependencies

```bash
cd Backend
npm install
```

### 2. Environment Configuration

The `.env` file is already configured with:
- **Port**: 5000
- **MongoDB URI**: Connected to cloud database
- **API Keys**: OpenAI, Groq, HuggingFace, ImageKit, Tavily (all configured)

If you need to modify these values, edit `Backend/.env`.

### 3. Start the Backend Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

Expected output:
```
Server is running on port http://localhost:5000
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

The `.env.local` file is already configured:
```
VITE_API_URL=http://localhost:5000
```

This tells the frontend where to find the backend API.

### 3. Start the Development Server

```bash
npm run dev
```

The application will start on `http://localhost:5173` (or another port if 5173 is busy).

### 4. Build for Production

```bash
npm run build
```

## API Integration Overview

The frontend and backend are now fully connected with the following API endpoints:

### User API
- `POST /api/user/register` - Register new user
- `POST /api/user/login` - Login user
- `GET /api/user/get` - Get current user (requires auth)

### Chat API
- `POST /api/chat/create` - Create new chat (requires auth)
- `GET /api/chat/` - Get all user chats (requires auth)
- `DELETE /api/chat/delete/:chatId` - Delete chat (requires auth)

### Message API
- `POST /api/messages/text` - Send text message (requires auth)
- `POST /api/messages/image` - Send image message (requires auth)

## Authentication Flow

1. **Register/Login**: User credentials are sent to the backend
2. **Token Generation**: Backend generates JWT token
3. **Token Storage**: Frontend stores token in `localStorage` as `authToken`
4. **Authenticated Requests**: All subsequent API calls include the token in the `Authorization` header
5. **Token Usage**: Backend middleware validates token for protected routes

## Running Both Servers Together

### Option 1: Two Terminal Windows (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd Backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Using npm-run-all (Single Command)

If you prefer running both from the root directory:

```bash
# Install globally (one-time)
npm install -g npm-run-all

# In root QuickChat folder, create package.json with:
{
  "scripts": {
    "dev": "npm-run-all --parallel dev:backend dev:frontend",
    "dev:backend": "cd Backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev"
  }
}

# Then run:
npm run dev
```

## Features Now Connected

✅ **User Authentication**
- Register new accounts
- Login with email/password
- JWT token-based session management
- Automatic logout on token expiration

✅ **Chat Management**
- Create new chats
- Fetch all user chats
- Delete chats
- Real-time chat selection

✅ **Messaging**
- Send text messages
- Receive AI responses
- Image generation (when enabled)
- Credit system integration

✅ **User Experience**
- Loading states
- Error handling and display
- Dark/Light theme toggle
- Sidebar with chat history
- Auto-redirect to login if not authenticated

## Troubleshooting

### Issue: Backend not accessible from frontend

**Solution**: Ensure:
1. Backend is running on port 5000
2. `VITE_API_URL=http://localhost:5000` in `frontend/.env.local`
3. CORS is enabled (already configured in backend)
4. No firewall blocking port 5000

### Issue: "Unauthorized" or "No token provided"

**Solution**:
1. Make sure you're logged in first
2. Check that token is saved in browser's localStorage
3. Restart the frontend application

### Issue: MongoDB connection error

**Solution**:
1. Check internet connection (MongoDB is cloud-based)
2. Verify `MONGO_URI` in `Backend/.env`
3. Ensure your IP is whitelisted in MongoDB Atlas

### Issue: Message sending fails

**Solution**:
1. Ensure you have enough credits (check user model)
2. Verify API keys are correctly set in `.env`
3. Check browser console for detailed error messages
4. Ensure the selected chat exists and belongs to the logged-in user

## Development Tips

### Enable Debug Logging

The API client in `frontend/src/utils/api.js` logs errors to the browser console. Open Developer Tools (F12) to see:
- API requests and responses
- Authentication tokens
- Error details

### API Testing Tools

You can test the backend APIs directly using:
- **Postman**: Import API endpoints and test with tokens
- **cURL**: Command-line tools for API testing
- **VS Code REST Client**: Use `.rest` files for testing

Example with cURL:
```bash
# Login
curl -X POST http://localhost:5000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Create Chat (replace TOKEN)
curl -X POST http://localhost:5000/api/chat/create \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

## Next Steps

1. **Test the application**: Register → Login → Create chat → Send message
2. **Check browser console**: Look for any API errors
3. **Monitor backend logs**: Watch for request logs and errors
4. **Customize features**: Modify components to match your needs

## Project Files Modified

- ✅ `frontend/src/utils/api.js` - API client configuration
- ✅ `frontend/src/pages/Login.jsx` - Login/Register integration
- ✅ `frontend/src/context/App.Context.jsx` - State management
- ✅ `frontend/src/components/Chatbox.jsx` - Message sending
- ✅ `frontend/src/components/Sidebar.jsx` - Chat management
- ✅ `frontend/.env.local` - Frontend environment variables
- ✅ `Backend/src/middleware/auth.middleware.js` - Token authentication
- ✅ `Backend/src/controllers/user.controller.js` - Login response
- ✅ `Backend/src/controllers/message.controller.js` - Message handling

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console logs (F12)
3. Check backend logs in terminal
4. Verify all environment variables are set correctly

Happy coding! 🚀
