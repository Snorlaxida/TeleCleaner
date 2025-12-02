# Setup Guide for TeleCleaner

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** or **yarn**
   - Comes with Node.js
   - Verify: `npm --version`

3. **Git**
   - Download from [git-scm.com](https://git-scm.com/)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Expo SDK
- React Native
- NativeWind (Tailwind CSS)
- Supabase client
- And more...

### 2. Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your credentials in `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   EXPO_PUBLIC_TELEGRAM_API_ID=your-telegram-api-id
   EXPO_PUBLIC_TELEGRAM_API_HASH=your-telegram-api-hash
   ```

### 3. Get Telegram API Credentials

1. Go to [my.telegram.org](https://my.telegram.org/)
2. Log in with your phone number
3. Navigate to "API development tools"
4. Create a new application
5. Copy your `api_id` and `api_hash`

### 4. Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com/)
2. Create a new project
3. Go to Settings > API
4. Copy your project URL and anon/public key
5. Paste them into your `.env` file

### 5. Add Assets

Add the required image assets to the `assets/` directory:
- `icon.png` (1024x1024)
- `splash.png` (1242x2436)
- `adaptive-icon.png` (1024x1024)
- `favicon.png` (48x48)

See `assets/README.md` for more details.

## Running the App

### Development Server

Start the Expo development server:

```bash
npm start
```

This will open Expo DevTools in your browser.

### Run on iOS Simulator (Mac only)

```bash
npm run ios
```

### Run on Android Emulator

```bash
npm run android
```

### Run on Physical Device

1. Install the **Expo Go** app from App Store or Google Play
2. Scan the QR code shown in the terminal or Expo DevTools

## Troubleshooting

### Module Not Found Errors

If you see "Cannot find module" errors:

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start --clear
```

### TypeScript Errors

The TypeScript errors you see before running `npm install` are expected. They will be resolved once dependencies are installed.

### Metro Bundler Issues

If the Metro bundler has issues:

```bash
npx expo start --clear
```

### iOS Simulator Not Opening

Make sure Xcode is installed:
```bash
xcode-select --install
```

### Android Emulator Issues

1. Install Android Studio
2. Set up an Android Virtual Device (AVD)
3. Ensure ANDROID_HOME is set in your environment

## Next Steps

1. **Implement Telegram Integration**: Replace the mock Telegram client in `lib/telegram.ts` with actual Telegram API calls
2. **Set Up Supabase Database**: Create tables for user sessions and deletion history
3. **Add Error Handling**: Implement comprehensive error handling throughout the app
4. **Testing**: Add unit and integration tests
5. **Deploy**: Use EAS Build to create production builds

## Useful Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build for production (requires EAS)
eas build --platform android
eas build --platform ios

# Submit to app stores
eas submit
```

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Telegram API Documentation](https://core.telegram.org/)

## Support

If you encounter any issues, please check:
1. This setup guide
2. The main README.md
3. Expo documentation
4. Create an issue in the repository
