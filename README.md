# Grocery App

Welcome to **Grocery App**, a modern, cross-platform mobile application for ordering fresh groceries seamlessly, built using React Native and Expo.

## Features

- **Modern & Clean UI**: Features a sleek, responsive user interface with a custom-designed logo and vibrant teal branding (`#48C2B7`).
- **Cross-Platform**: Compiles to iOS, Android, and Web using Expo.
- **State Management**: Lightweight, fast global state handling via Zustand.
- **Authentication & Backend**: Ready to be connected with Supabase.
- **Routing**: File-based routing implemented through Expo Router.
- **Localization**: Supports multiple languages via `i18next`.

## Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator (for macOS) or Android Emulator

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd grocery_app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root of the project and add your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

## Running the App

### Start the Bundler
Run the following command to start the Expo Metro Bundler:
```bash
npm start
```
From the terminal menu, you can press `i` to open in the iOS simulator, `a` for Android, or `w` for the web.

### Run Native Builds
Because this project utilizes a bare workflow for custom native assets (like our brand-new splash screen and app icons), you can compile and run directly via:

- **iOS:**
  ```bash
  npm run ios
  ```
- **Android:**
  ```bash
  npm run android
  ```

## Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) & [Expo SDK 55](https://expo.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Database / Auth**: [Supabase](https://supabase.com/)
- **Icons**: [Lucide React Native](https://lucide.dev/) & Expo Vector Icons

## Custom Assets

The app uses a custom vector logo (`app-logo.png`) that was integrated directly into the native projects using `npx expo prebuild`. Unused boilerplate assets and scripts have been fully removed to keep the workspace clean.
