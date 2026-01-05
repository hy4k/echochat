# EchoChat - Exclusive Two-Person Communication Platform

A classy, romantic communication platform designed for two people to connect through text, voice, and video. Built with modern web technologies and deployed on Hostinger VPS using Coolify.

## ✨ Features

### 🎯 Core Communication
- **Real-time Text Chat**: Instant messaging with typing indicators and delivery status
- **Voice Calling**: WebRTC-based peer-to-peer voice communication
- **Video Calling**: High-quality video calls with adaptive bitrate
- **Message Types**: Support for text, voice notes, and video messages

### 💌 Offline Messaging
- **Offline Text Messages**: Send messages when the other person is away
- **Voice Notes**: Record and send voice messages offline
- **Video Messages**: Record and send video messages offline
- **Delivery Notifications**: Get notified when offline messages are viewed

### 🌅 Shared Horizon
A romantic feature that synchronizes the weather and time of day from both users' locations:
- Real-time weather sync between locations
- Time-of-day visualization with dynamic backgrounds
- Shared atmospheric experience despite distance
- Location-based weather integration

### 📸 Digital Keepsakes
A gallery to pin and revisit favorite moments:
- Polaroid-style card design for cherished messages
- Pin favorite conversations as keepsakes
- Organized timeline of special moments
- Easy deletion and management

### 👁️ Presence Indicators
- Online/offline status in real-time
- Last seen timestamps
- Location sharing (optional)
- Timezone awareness

### 🎨 Design
- **Color Palette**: Deep midnight blue, champagne gold, rose quartz
- **Typography**: Playfair Display (serif) + Inter (sans-serif)
- **Aesthetic**: Minimalist, romantic, intimate
- **Responsive**: Works seamlessly on mobile and desktop

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- pnpm package manager
- MySQL/TiDB database
- Modern web browser with WebRTC support

### Local Development

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm db:push

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
```

## 📁 Project Structure

```
echochat/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts
│   │   ├── lib/           # Utilities and helpers
│   │   └── App.tsx        # Main app component
│   └── public/            # Static assets
├── server/                # Express backend
│   ├── routers.ts         # tRPC route definitions
│   ├── db.ts              # Database queries
│   ├── websocket.ts       # WebSocket setup
│   └── _core/             # Core framework
├── drizzle/               # Database schema
│   └── schema.ts          # Table definitions
├── Dockerfile             # Docker image
├── docker-compose.yml     # Docker Compose config
├── DEPLOYMENT.md          # Deployment guide
└── README.md              # This file
```

## 🛠️ Technology Stack

### Frontend
- **React 19**: UI framework
- **Tailwind CSS 4**: Styling
- **tRPC**: Type-safe API client
- **Socket.io Client**: Real-time communication
- **Wouter**: Lightweight routing
- **Lucide React**: Icons

### Backend
- **Express 4**: Web server
- **tRPC 11**: Type-safe RPC framework
- **Socket.io**: WebSocket server
- **Drizzle ORM**: Database ORM
- **MySQL2**: Database driver

### Database
- **MySQL/TiDB**: Relational database
- **Drizzle Kit**: Schema migrations

### DevOps
- **Docker**: Containerization
- **Coolify**: Deployment platform
- **Vitest**: Testing framework
- **TypeScript**: Type safety

## 📊 Database Schema

### Users
- User authentication and profile information
- OAuth integration with Manus platform

### Messages
- Real-time chat messages
- Message type (text, voice, video)
- Delivery status tracking (sent, delivered, read)

### Offline Messages
- Messages sent when recipient is offline
- Support for text, voice, and video
- Viewed status tracking

### User Presence
- Online/offline status
- Last seen timestamps
- Location and timezone data

### Shared Horizon
- Weather conditions and temperature
- Time of day information
- Dynamic background colors

### Keepsakes
- Pinned favorite messages
- Custom titles and descriptions
- Timestamp tracking

## 🔐 Security

- **OAuth Authentication**: Secure login via Manus platform
- **JWT Sessions**: Secure session management
- **HTTPS/TLS**: End-to-end encryption
- **WebSocket Security**: Authenticated connections
- **Database Security**: Foreign key constraints and validation
- **Input Validation**: Zod schema validation on all inputs

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test features.test.ts

# Generate coverage report
pnpm test --coverage
```

### Test Coverage
- Authentication and authorization
- Message sending and receiving
- Offline message handling
- Presence tracking
- Keepsakes management
- Input validation
- Router structure

## 📱 API Endpoints

### Authentication
- `POST /api/oauth/callback` - OAuth callback
- `GET /api/trpc/auth.me` - Get current user
- `POST /api/trpc/auth.logout` - Logout

### Chat
- `POST /api/trpc/chat.sendMessage` - Send message
- `GET /api/trpc/chat.getMessages` - Get message history
- `POST /api/trpc/chat.updateMessageStatus` - Update delivery status

### Offline Messages
- `POST /api/trpc/offlineMessages.createOfflineMessage` - Create offline message
- `GET /api/trpc/offlineMessages.getOfflineMessages` - Get offline messages
- `POST /api/trpc/offlineMessages.markAsViewed` - Mark as viewed

### Presence
- `POST /api/trpc/presence.setOnline` - Set user online
- `POST /api/trpc/presence.setOffline` - Set user offline
- `GET /api/trpc/presence.getPresence` - Get user presence
- `GET /api/trpc/presence.getBothPresence` - Get both users' presence

### Keepsakes
- `POST /api/trpc/keepsakes.createKeepsake` - Pin a message
- `GET /api/trpc/keepsakes.getKeepsakes` - Get keepsakes
- `POST /api/trpc/keepsakes.deleteKeepsake` - Delete keepsake

### Shared Horizon
- `POST /api/trpc/sharedHorizon.updateHorizon` - Update horizon data
- `GET /api/trpc/sharedHorizon.getHorizon` - Get horizon for user
- `GET /api/trpc/sharedHorizon.getBothHorizons` - Get both horizons

## 🌐 WebSocket Events

### User Events
- `user:join` - User connects
- `user:online` - User comes online
- `user:offline` - User goes offline
- `user:status` - Get online status

### Message Events
- `message:send` - Send message
- `message:receive` - Receive message
- `message:status` - Message status update
- `message:read` - Message read receipt

### Typing Events
- `typing:start` - User starts typing
- `typing:stop` - User stops typing

### Call Events
- `call:initiate` - Initiate voice/video call
- `call:incoming` - Incoming call
- `call:accept` - Accept call
- `call:reject` - Reject call

### WebRTC Events
- `webrtc:offer` - WebRTC offer
- `webrtc:answer` - WebRTC answer
- `webrtc:ice-candidate` - ICE candidate

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

### Quick Deploy to Coolify

1. Push code to GitHub
2. In Coolify, create new project from Git
3. Configure environment variables
4. Set domain to `echochat.space`
5. Deploy

## 📝 Environment Variables

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/echochat

# Authentication
JWT_SECRET=your_secure_secret
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im

# Owner
OWNER_OPEN_ID=your_open_id
OWNER_NAME=Your Name

# APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your_key

# Application
NODE_ENV=production
```

## 🎯 Roadmap

### Phase 1: MVP ✅
- [x] Real-time text chat
- [x] User authentication
- [x] Message history
- [x] Presence indicators
- [x] Landing page

### Phase 2: Voice & Video
- [ ] WebRTC voice calling
- [ ] WebRTC video calling
- [ ] Call quality indicators
- [ ] Screen sharing

### Phase 3: Advanced Features
- [ ] Message search
- [ ] Message reactions
- [ ] Voice transcription
- [ ] AI-powered suggestions

### Phase 4: Analytics
- [ ] Usage statistics
- [ ] Conversation insights
- [ ] Engagement metrics

## 🐛 Known Issues

- WebRTC requires HTTPS in production
- Some older browsers may not support WebRTC
- Offline messaging requires database connectivity

## 💡 Tips

- Use the Shared Horizon feature to feel connected across distances
- Pin important messages as Digital Keepsakes
- Enable location sharing for weather sync
- Use voice notes for more personal communication

## 📞 Support

For deployment issues, visit: https://help.manus.im

For technical questions, check the [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section.

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with ❤️ for meaningful connections across distance.

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Domain**: echochat.space
