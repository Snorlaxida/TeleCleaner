# Quick Start Guide

Get TeleCleaner up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn installed
- A smartphone with Expo Go app (optional, for testing on device)

## Installation

### 1. Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required packages. The process may take 2-3 minutes.

### 2. Set Up Environment Variables

Create a `.env` file:

```bash
# On Windows (PowerShell)
Copy-Item .env.example .env

# On Mac/Linux
cp .env.example .env
```

**For now, you can leave the `.env` file as is.** The app will work with mock data for initial testing.

### 3. Start the Development Server

```bash
npm start
```

This will:
- Start the Expo development server
- Open Expo DevTools in your browser
- Display a QR code in the terminal

## Running the App

You have three options:

### Option 1: iOS Simulator (Mac only)

Press `i` in the terminal or run:
```bash
npm run ios
```

### Option 2: Android Emulator

Press `a` in the terminal or run:
```bash
npm run android
```

### Option 3: Your Phone (Easiest!)

1. Install **Expo Go** from:
   - [App Store (iOS)](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code:
   - **iOS**: Use the Camera app
   - **Android**: Use the Expo Go app

## What You'll See

The app will start with:

1. **Splash Screen** - Shows the TeleCleaner logo
2. **Phone Authentication** - Enter any phone number (mock data)
3. **Verification Code** - Enter any 6-digit code (mock data)
4. **Chat List** - See mock Telegram chats
5. **Settings** - Access app settings

## Testing the App

### Try These Features:

1. **Select Chats**
   - Tap checkboxes next to chats
   - See the selection count at the top

2. **Choose Deletion Option**
   - Tap "Delete Messages" button
   - Select time range (last day, last week, or all)

3. **Navigate**
   - Switch between Chats and Settings tabs
   - Explore the settings options

## Known Limitations (Mock Data)

Currently, the app uses mock data:
- ✅ UI and navigation work perfectly
- ✅ All screens are functional
- ❌ No real Telegram connection yet
- ❌ No actual message deletion yet

## Next Steps

### To Connect Real Telegram:

1. Get Telegram API credentials:
   - Visit [my.telegram.org](https://my.telegram.org/)
   - Create an app
   - Get your `api_id` and `api_hash`

2. Add to `.env`:
   ```
   EXPO_PUBLIC_TELEGRAM_API_ID=your_api_id
   EXPO_PUBLIC_TELEGRAM_API_HASH=your_api_hash
   ```

3. Implement the Telegram client in `lib/telegram.ts`

### To Set Up Supabase:

1. Create account at [supabase.com](https://supabase.com/)
2. Create a new project
3. Get your URL and anon key
4. Add to `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

## Troubleshooting

### "Cannot find module" errors

These are expected before running `npm install`. Run:
```bash
npm install
```

### Metro bundler issues

Clear the cache:
```bash
npx expo start --clear
```

### Port already in use

Kill the process or use a different port:
```bash
npx expo start --port 8081
```

### App won't load on phone

Make sure:
- Your phone and computer are on the same WiFi
- Firewall isn't blocking the connection
- You're using the latest Expo Go app

## Useful Commands

```bash
# Start dev server
npm start

# Clear cache and restart
npx expo start --clear

# Type checking
npm run type-check

# View on different devices
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

## Getting Help

- **Setup Issues**: See `SETUP.md`
- **Project Info**: See `PROJECT_SUMMARY.md`
- **General Info**: See `README.md`

## Development Tips

1. **Hot Reload**: Changes to code will automatically reload the app
2. **Shake Device**: Shake your phone to open the developer menu
3. **Console Logs**: View logs in the terminal where you ran `npm start`
4. **Debugging**: Press `j` in terminal to open Chrome DevTools

## What's Working Right Now

✅ Complete UI/UX flow  
✅ Navigation between screens  
✅ Chat selection  
✅ Deletion options modal  
✅ Settings screen  
✅ Beautiful Telegram-inspired design  

## What Needs Implementation

⏳ Real Telegram API integration  
⏳ Actual message deletion  
⏳ User authentication  
⏳ Error handling  
⏳ Loading states  

---

**Ready to code?** Start by exploring the files in the `app/` directory!

**Questions?** Check the other documentation files or create an issue.

Happy coding! 🚀
