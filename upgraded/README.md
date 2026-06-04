# NexChat — Upgraded Chat App 🚀

## What Changed (Complete Upgrade Guide)

---

## 🎨 UI/UX Overhaul

### Dark Premium Theme
- Brand new **dark theme** with deep navy/slate color palette
- CSS variables system for full consistency
- Glassmorphism-style cards with gradient border accents
- Subtle dot-grid background pattern in chat area

### Typography
- **Plus Jakarta Sans** — modern, clean, premium feel
- **JetBrains Mono** — for code snippets (future use)
- Google Fonts imported in layout.js

### Animations Added
| Animation | Where |
|-----------|-------|
| `fadeSlideUp` | Page loads, messages appearing |
| `messagePop` (spring) | Every new message bubble |
| `fadeSlideIn` | Auth card, sidebar |
| `typingDot` | Typing indicator dots |
| `onlinePing` | Online status dot pulse |
| `shimmer` | Loading skeletons |
| `floatBg` | Auth page background orbs |
| Hover lift | Buttons (translateY -1px) |
| Send button spin | Hover rotate effect |
| Input focus glow | Focus ring with box-shadow |

---

## ✨ New Features Added

### 1. Emoji Reactions on Messages
- Hover over any message → reaction picker appears
- Click emoji → reaction badge shows on message
- Click badge again → increments count
- Smooth animation on reaction add

### 2. Typing Indicator
- Real-time "username is typing…" shown to others
- Animated 3-dot bouncing indicator
- Auto-hides after 2.5 seconds of no typing
- Server broadcasts via Socket.IO `typing` event

### 3. Online Users Panel (Sidebar)
- Left sidebar shows all online users
- Real-time updates via `online_users` socket event
- Animated green ping dot on each online user
- Server tracks users via `onlineUsers` Map

### 4. Message Reply System
- Hover → click ↩ button to reply
- Reply banner shows in input area
- Replied message preview shown inside bubble
- Cancel reply button

### 5. Quick Emoji Picker
- 😊 button opens emoji grid in input area
- Click emoji → inserts into message
- 16 commonly used emojis

### 6. Room Switcher (Sidebar)
- 4 channels: #general, #random, #tech-talk, #announcements
- Visual active state with purple highlight

### 7. Auto-growing Textarea
- Input expands as you type multi-line messages
- Shift+Enter for new line, Enter to send
- Max height 120px then scrolls

### 8. Date Dividers in Chat
- Messages grouped by date
- "Today", "Yesterday", or formatted date shown
- Elegant divider line with centered label

### 9. Double-tick Read Status
- ✓✓ shown on own messages (like WhatsApp)
- Styled in accent green

### 10. Show/Hide Password Toggle
- Eye icon on password fields
- Works on both Login and Signup

### 11. Better Error Handling
- Proper error messages from API (email taken, wrong password, etc.)
- Alert component with error/success styles
- Form validation before API call

### 12. Loading State Improvements
- Spinner on login/signup buttons while loading
- Full-screen spinner on chat page load
- Disabled button state during submission

### 13. Rebranded to "NexChat"
- New logo icon (💬)
- App name in header and sidebar
- Updated page metadata

---

## 🔧 Backend Changes (server.js)

| Change | Detail |
|--------|--------|
| Online users tracking | `Map<socketId, username>` |
| `user_join` event | User announces themselves on connect |
| `online_users` broadcast | Emits array of usernames to all clients |
| `typing` event | Broadcasts to all except sender |
| Message `replyTo` field | Saved in MongoDB |
| Message limit | Last 100 messages on load |
| Health endpoint | `GET /api/health` |
| Better logging | Emoji-prefixed console logs |

---

## 📁 File Structure of Changes

```
client/src/app/
├── globals.css          ← COMPLETE REWRITE (dark theme + all animations)
├── layout.js            ← Added Google Fonts link
├── page.js              ← Added onlineUsers state + socket events
├── components/
│   └── ChatRoom.jsx     ← MAJOR REWRITE (sidebar, reactions, typing, reply)
├── login/page.jsx       ← Redesigned (dark card, show/hide pw, error handling)
└── signup/page.jsx      ← Redesigned (2-col name row, validation, error)

server/
├── server.js            ← Added typing, online users, replyTo
└── models/Message.js    ← Added replyTo + reactions + edited fields
```

---

## 🚀 How to Run

### Server
```bash
cd server
npm install
npm start   # or: node server.js
```

### Client
```bash
cd client
npm install
npm run dev
```

Open: http://localhost:3000

---

## 🔮 Future Features You Can Add

- [ ] Private/Direct Messages (DMs)
- [ ] File & image sharing
- [ ] Message search
- [ ] Notification sounds
- [ ] User profile page with avatar upload
- [ ] Message edit & delete
- [ ] Push notifications (Web Push API)
- [ ] Read receipts per user
- [ ] Message pinning
- [ ] Dark/Light mode toggle
- [ ] Message pagination (infinite scroll)
- [ ] Admin controls (kick, mute)
