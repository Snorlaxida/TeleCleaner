# Telegram Message Cleaner

## Project Breakdown
- **App Name:** Telegram Message Cleaner  
- **Platform:** Mobile  
- **Summary:** The Telegram Message Cleaner app is designed to simplify the process of managing unwanted messages in Telegram. With a user-centric interface, this app empowers users to efficiently delete their own messages from various chats based on specific time intervals, helping them maintain cleaner conversations and reduce clutter. Our goal is to streamline the message cleanup process, encouraging users to take control of their chat environments effectively.  
- **Primary Use Case:** The primary use case involves users needing to delete specific messages in their Telegram chats. The app enables users to filter and select messages from the last day, week, or to delete all of their messages through a straightforward and intuitive interface.  
- **Authentication Requirements:** Users will authenticate using their phone numbers. This authentication process allows the app to interact securely with the Telegram API, ensuring that only the user's messages are affected during cleanup operations.

## Tech Stack Overview
- **Framework:** Expo (React Native)  
- **Language:** TypeScript  
- **Navigation:** Expo Router  
- **Styling:** NativeWind  
- **Backend (BaaS):** Supabase (for authentication, database, edge functions)  
- **Deployment:** Expo Application Services (EAS)  

## Core Features
1. **User Authentication:**  
   - Seamless login via phone number integrated with Telegram’s API to ensure security and privacy.
2. **Chat Listing:**  
   - Display a list of all accessible chats styled similarly to Telegram, with visual checkboxes for user-friendly selection.
3. **Deletion Options:**  
   - Options for selecting message deletion by time intervals—last day, last week, or delete all messages in a chat for quick and efficient cleanup.
4. **Feedback Mechanism:**  
   - Allow users to provide feedback about the deletion process to support continuous improvement.

## User Flow
1. **Launch App:** User opens the app to a splash screen with the app logo.  
2. **Phone Number Authentication:**  
   - User is prompted to enter their phone number for authentication.  
   - App sends a verification code via Telegram.  
3. **Chat Listing:**  
   - After verification, the user is taken to the chat listing page.  
   - Each chat is displayed with checkboxes next to them for selection.  
4. **Select Chats:**  
   - User checks the boxes next to the chats from which they want to delete messages.  
5. **Choose Deletion Option:**  
   - User selects a deletion option (last day, last week, or all messages) through intuitive buttons.  
6. **Review and Confirm:**  
   - A review screen displays the selected chats and deletion options, allowing the user to confirm their choices.  
7. **Deletion Process:**  
   - The app processes the deletion via Telegram API. A progress indicator shows the status.  
8. **Completion Notification:**  
   - Upon completion, the user receives feedback on which messages were deleted successfully.  
9. **Return to Chat List:**  
   - The user can either delete more messages or exit the app.  

## Design and UI/UX Guidelines
- **Clean Layout:** Follow Telegram’s design language closely to provide a familiar experience for users.
- **Navigation:** Utilize bottom navigation for easy access between chat listings and settings (if applicable).  
- **Interactivity:** Use gesture-based interactions; a long press on messages to bring up contextual options should feel smooth and responsive.  
- **Responsive Design:** All UI components should be adaptable for different device sizes, ensuring usability on various screens.
- **Feedback Prompt:** Use toast notifications for success and error messages to maintain user engagement without disrupting the workflow.

## Technical Implementation Approach
- Build the app using Expo (React Native) to develop a cross-platform mobile experience.
- Leverage TypeScript to ensure type safety throughout the codebase, making it easier to maintain and scale.
- Utilize Expo Router for intuitive navigation patterns that mimic Telegram’s flow, enhancing UX consistency.
- Implement NativeWind for styling to maximize customization and responsiveness of the visual components.
- Use Supabase for user management and message data handling. Create edge functions to handle the message deletion logic seamlessly.  
- Deploy the application using EAS for efficient management of builds and updates, as well as for quick distribution to beta testing.

## Required Development Tools and Setup Instructions
1. **Install Node.js and npm:** Ensure you have the latest versions of Node.js and npm installed on your machine.
2. **Install Expo CLI:**  
   ```bash
   npm install -g expo-cli
   ``` 
3. **Set Up React Native Environment:** Follow [React Native setup guidelines](https://reactnative.dev/docs/environment-setup) to ensure proper configuration for your OS.  
4. **Create a New Expo Project:**  
   ```bash
   expo init TelegramMessageCleaner
   ``` 
5. **Add TypeScript Support:**  
   - You can convert the project to TypeScript by adding a `tsconfig.json` file.
6. **Install Dependencies:**  
   ```bash
   npm install @react-navigation/native @react-navigation/native-stack nativewind@latest supabase_js
   ``` 
7. **Start Development Server:**  
   ```bash
   expo start
   ``` 
8. **Prepare for Deployment:**  
   - Follow [EAS deployment instructions](https://docs.expo.dev/submit/introduction/) to ensure your app is ready for production.