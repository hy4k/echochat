# EchoChat - Project TODO

## Phase 1: Database Schema & Core Setup
- [x] Define database schema for messages, users, offline messages, keepsakes, presence
- [x] Set up WebSocket infrastructure for real-time communication
- [ ] Configure environment variables for Coolify deployment

## Phase 2: Landing Page & Authentication
- [x] Design "Waiting for You" landing page with elegant animations
- [x] Implement OAuth authentication flow (built-in)
- [ ] Create user profile setup page
- [x] Add romantic welcome screen for first visitor

## Phase 3: Real-time Text Chat
- [x] Implement text message sending and receiving (mock)
- [x] Add typing indicators with heartbeat animation
- [x] Implement message delivery status (sent, delivered, read)
- [x] Create message history UI with elegant styling
- [x] Add message timestamps and formatting

## Phase 4: WebRTC Voice & Video
- [x] Set up WebRTC peer connection infrastructure (WebSocket ready)
- [ ] Implement voice calling with audio stream handling
- [ ] Implement video calling with video stream handling
- [ ] Add call initiation and acceptance UI
- [ ] Implement call termination and error handling
- [ ] Add audio/video quality indicators

## Phase 5: Offline Messaging System
- [x] Create offline message storage in database
- [x] Implement text message offline queue (backend ready)
- [ ] Implement voice note recording and offline storage
- [ ] Implement video message recording and offline storage
- [ ] Create "Waiting for You" gallery for offline messages
- [ ] Add notification system for new offline messages

## Phase 6: Shared Horizon Feature
- [x] Create Shared Horizon visualization page
- [ ] Integrate weather API for both users' locations
- [ ] Implement time-of-day detection for both users
- [x] Create dynamic background color scheme based on weather/time
- [ ] Sync background changes in real-time between users
- [ ] Add location settings UI for users

## Phase 7: Digital Keepsakes Gallery
- [x] Create keepsakes database table
- [ ] Implement pin/favorite functionality for messages
- [x] Design polaroid-style card UI
- [x] Create keepsakes gallery page
- [ ] Add filtering and sorting for keepsakes
- [x] Implement keepsake deletion functionality

## Phase 8: Presence & Message History
- [x] Implement online/offline presence indicators (backend ready)
- [x] Add last seen timestamp tracking (database ready)
- [x] Create presence sync mechanism (WebSocket ready)
- [ ] Implement message history pagination
- [ ] Add message search functionality
- [ ] Create message export feature

## Phase 9: UI/UX Polish
- [x] Apply romantic color scheme (midnight blue, champagne gold, rose quartz)
- [x] Implement Playfair Display + clean sans-serif typography
- [x] Add smooth animations and transitions
- [x] Ensure responsive design for mobile and desktop
- [ ] Add accessibility features (ARIA labels, keyboard navigation)
- [ ] Implement dark/light theme support

## Phase 10: Testing & Deployment
- [x] Write unit tests for core features (28 tests passing)
- [ ] Test WebRTC functionality across browsers
- [x] Create Dockerfile for Coolify deployment
- [x] Set up environment configuration for Hostinger VPS
- [ ] Configure domain echochat.space (manual step)
- [ ] Test offline messaging scenarios
- [ ] Performance testing and optimization

## Phase 11: Documentation & Final Delivery
- [x] Create deployment guide for Coolify (DEPLOYMENT.md)
- [x] Document feature usage (README.md)
- [x] Create user guide (README.md)
- [x] Prepare final version for delivery


## Phase 12: Shared Whiteboard Feature
- [x] Create whiteboard database table for storing drawing sessions
- [x] Implement canvas-based drawing component with brush tools
- [x] Add color picker and brush size controls
- [ ] Implement real-time drawing sync via WebSocket
- [x] Add undo/redo functionality
- [x] Create clear canvas and save drawing features
- [ ] Add drawing history and session management
- [ ] Implement collaborative cursor indicators
- [ ] Test whiteboard across browsers
- [x] Add whiteboard navigation button to chat header


## Phase 13: Real-time Drawing Sync
- [x] Implement Socket.io event broadcasting for drawing strokes
- [x] Add stroke synchronization between connected users
- [x] Implement collaborative cursor indicators with user names
- [x] Add drawing session state management
- [ ] Test real-time sync across multiple browser windows
- [x] Add connection status indicator on whiteboard

## Phase 14: WebRTC Voice & Video Calling
- [x] Implement proper RTCPeerConnection setup with ICE candidates
- [x] Add signaling via WebSocket for call initiation
- [x] Implement audio stream capture and transmission
- [x] Implement video stream capture and transmission
- [x] Add call state management (ringing, connected, ended)
- [x] Implement microphone/camera permission handling
- [x] Add audio/video quality indicators
- [ ] Implement call recording capability (optional)
- [ ] Test across different browsers (Chrome, Firefox, Safari)
- [x] Add error handling for network issues


## Phase 15: WebRTC Chat Integration
- [x] Import WebRTCCall component into Chat.tsx
- [x] Add call state management to Chat component
- [x] Implement call initiation buttons (voice and video)
- [x] Handle incoming call notifications
- [x] Manage call acceptance and rejection
- [x] Replace existing call UI with WebRTCCall component
- [ ] Test voice calls between users
- [ ] Test video calls between users
- [x] Test call ending and cleanup
- [ ] Add call history tracking


## Phase 16: Offline Message Notification System
- [x] Create notification database table with status tracking
- [x] Implement notification service for offline message detection
- [x] Add browser notification API integration
- [x] Create in-app notification toast system
- [x] Implement notification badges for unread offline messages
- [x] Add notification sound/vibration alerts
- [x] Create notification history and archive
- [x] Implement notification preferences/settings
- [x] Add notification clearing and dismissal
- [ ] Test notification delivery across devices
