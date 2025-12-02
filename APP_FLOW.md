# TeleCleaner - App Flow & Architecture

## User Flow Diagram

```
┌─────────────────┐
│  Splash Screen  │
│   (index.tsx)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Phone Auth     │
│  (phone.tsx)    │
│                 │
│ • Enter phone   │
│ • Send code     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Verify Code    │
│  (verify.tsx)   │
│                 │
│ • Enter 6 digits│
│ • Auto-verify   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│      Main App (Tabs)            │
├─────────────────┬───────────────┤
│   Chats Tab     │ Settings Tab  │
│  (chats.tsx)    │(settings.tsx) │
│                 │               │
│ • Chat list     │ • Account     │
│ • Multi-select  │ • Privacy     │
│ • Delete button │ • Support     │
└────────┬────────┴───────────────┘
         │
         ▼
┌─────────────────┐
│ Deletion Modal  │
│                 │
│ • Last 24h      │
│ • Last 7 days   │
│ • All messages  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Confirmation   │
│                 │
│ • Review        │
│ • Confirm       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Processing    │
│                 │
│ • Progress bar  │
│ • Status        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Complete     │
│                 │
│ • Summary       │
│ • Back to chats │
└─────────────────┘
```

## Screen Breakdown

### 1. Splash Screen (`app/index.tsx`)
**Purpose**: Initial loading and auth check

**Elements**:
- App logo (🧹)
- App name "TeleCleaner"
- Tagline "Clean Your Messages"
- Loading indicator

**Logic**:
- Check if user is authenticated
- Navigate to phone auth or main app

---

### 2. Phone Authentication (`app/(auth)/phone.tsx`)
**Purpose**: Collect user's phone number

**Elements**:
- Header: "Your Phone"
- Phone input field
- Continue button
- Info text

**Validation**:
- Minimum 10 digits
- Valid phone format

**Actions**:
- Send verification code via Telegram
- Navigate to verification screen

---

### 3. Code Verification (`app/(auth)/verify.tsx`)
**Purpose**: Verify phone number with code

**Elements**:
- Phone number display
- 6 code input boxes
- Resend code button
- Auto-verification

**Features**:
- Auto-focus next input
- Auto-verify when complete
- Backspace navigation

**Actions**:
- Verify code with Telegram
- Create session
- Navigate to main app

---

### 4. Chat List (`app/(tabs)/chats.tsx`)
**Purpose**: Display and select chats for deletion

**Elements**:
- Selection header (when chats selected)
- Chat list with:
  - Checkbox
  - Avatar
  - Chat name
  - Last message
  - Timestamp
  - Message count
- Delete button (when selected)

**Features**:
- Multi-select chats
- Clear selection
- Visual feedback

**Actions**:
- Toggle chat selection
- Open deletion modal
- Navigate to settings

---

### 5. Settings (`app/(tabs)/settings.tsx`)
**Purpose**: App configuration and account management

**Sections**:
1. **Account**
   - Phone number
   - Privacy & Security

2. **App Settings**
   - Notifications
   - Data & Storage

3. **Support**
   - Help & FAQ
   - Send Feedback

4. **About**
   - Version
   - Terms of Service
   - Privacy Policy

5. **Logout**
   - Sign out button

---

### 6. Deletion Options Modal (`components/DeletionOptionsModal.tsx`)
**Purpose**: Select time range for deletion

**Options**:
1. **Last 24 Hours**
   - Delete messages from last day

2. **Last 7 Days**
   - Delete messages from last week

3. **All Messages**
   - Delete all your messages

**Actions**:
- Select option
- Show confirmation dialog
- Cancel and close

---

## Component Architecture

```
App Root (_layout.tsx)
│
├── Splash (index.tsx)
│
├── Auth Flow
│   ├── Phone Input (phone.tsx)
│   └── Code Verification (verify.tsx)
│
└── Main App (tabs/_layout.tsx)
    ├── Chats Tab (chats.tsx)
    │   ├── ChatListItem (component)
    │   └── DeletionOptionsModal (component)
    │
    └── Settings Tab (settings.tsx)
```

## Data Flow

```
User Action
    ↓
Component State
    ↓
API Call (Telegram/Supabase)
    ↓
Response
    ↓
Update State
    ↓
Re-render UI
```

## State Management

### Local State (useState)
- Form inputs
- Selection state
- Modal visibility
- Loading states

### Navigation State (Expo Router)
- Current route
- Route parameters
- Navigation history

### Session State (Supabase)
- User authentication
- Session tokens
- User preferences

## API Integration Points

### Telegram API
1. **Authentication**
   - `sendCode(phoneNumber)`
   - `signIn(phoneNumber, code)`

2. **Chat Operations**
   - `getChats()`
   - `getMessages(chatId, limit)`

3. **Deletion**
   - `deleteMessages(chatId, messageIds)`

### Supabase
1. **Authentication**
   - Session management
   - Token refresh

2. **Database**
   - User settings
   - Deletion history
   - Analytics

3. **Edge Functions**
   - Batch deletion orchestration
   - Error logging
   - Statistics

## Navigation Structure

```
Stack Navigator (Root)
│
├── index (Splash)
│
├── (auth) Group
│   ├── phone
│   └── verify
│
└── (tabs) Group
    ├── chats
    └── settings
```

## File Organization

```
app/
├── _layout.tsx           # Root layout with Stack
├── index.tsx             # Splash screen
├── (auth)/
│   ├── phone.tsx        # Phone input
│   └── verify.tsx       # Code verification
└── (tabs)/
    ├── _layout.tsx      # Tab layout
    ├── chats.tsx        # Chat list
    └── settings.tsx     # Settings

components/
├── ChatListItem.tsx     # Individual chat item
└── DeletionOptionsModal.tsx  # Time range selector

lib/
├── supabase.ts          # Supabase client
└── telegram.ts          # Telegram API client

types/
└── index.ts             # TypeScript definitions
```

## Key Features Implementation

### 1. Multi-Select Chats
```typescript
const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());

const toggleChatSelection = (chatId: string) => {
  const newSelection = new Set(selectedChats);
  if (newSelection.has(chatId)) {
    newSelection.delete(chatId);
  } else {
    newSelection.add(chatId);
  }
  setSelectedChats(newSelection);
};
```

### 2. Time-Based Filtering
```typescript
const filterMessagesByTime = (messages, timeRange) => {
  const now = new Date();
  switch (timeRange) {
    case 'last_day':
      return messages.filter(msg => 
        msg.date >= new Date(now - 24*60*60*1000)
      );
    case 'last_week':
      return messages.filter(msg => 
        msg.date >= new Date(now - 7*24*60*60*1000)
      );
    case 'all':
      return messages;
  }
};
```

### 3. Batch Deletion
```typescript
const processDeletion = async (option: DeletionOption) => {
  for (const chatId of selectedChats) {
    const messages = await getMessages(chatId);
    const filtered = filterMessagesByTime(messages, option);
    const messageIds = filtered.map(m => m.id);
    await deleteMessages(chatId, messageIds);
  }
};
```

## Styling Approach

### NativeWind (Tailwind CSS)
- Utility-first CSS
- Responsive design
- Consistent spacing
- Color system

### Telegram Design Language
- Clean, minimal interface
- Familiar UI patterns
- Blue color scheme (#0088cc)
- System fonts

### Example
```tsx
<View className="flex-1 bg-white">
  <TouchableOpacity className="bg-telegram-blue py-4 rounded-lg">
    <Text className="text-white text-center font-semibold">
      Continue
    </Text>
  </TouchableOpacity>
</View>
```

## Error Handling Strategy

### 1. Network Errors
- Show retry button
- Cache data locally
- Offline mode

### 2. API Errors
- User-friendly messages
- Log to Supabase
- Fallback options

### 3. Validation Errors
- Inline error messages
- Prevent invalid submissions
- Clear error states

## Performance Considerations

### 1. List Optimization
- FlatList for chat rendering
- Item key optimization
- Pagination for large lists

### 2. State Management
- Minimize re-renders
- Use memo for expensive calculations
- Debounce user inputs

### 3. API Calls
- Batch requests
- Cache responses
- Rate limiting

---

**This document provides a high-level overview of the app's architecture and flow.**

For implementation details, see the actual code files.
For setup instructions, see `SETUP.md` or `QUICKSTART.md`.
