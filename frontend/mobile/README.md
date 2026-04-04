# AthleteOS Mobile

Expo Router mobile app for athletes, built on Expo SDK 51+, React Native, NativeWind, Zustand, and TanStack Query.

## Setup

From `frontend/mobile`:

```bash
npm install
npm run start
```

If you want a fresh Expo scaffold instead of the checked-in structure, the equivalent starter command is:

```bash
npx create-expo-app mobile --template expo-template-blank-typescript
```

Then align dependencies with `package.json`.

## Key Features

- Expo Router file-based navigation under `app/`
- persisted auth and offline session queue with Zustand + AsyncStorage
- React Query cache persistence for dashboard, sessions, and risk data
- Expo Notifications registration and deep-link navigation
- multilingual UI with `i18next`
- NativeWind styling with the AthleteOS shared design system

## Running On A Device

```bash
npm run start
```

Then:

- scan the QR code with Expo Go, or
- press `a` for Android emulator, or
- press `i` for iOS simulator on macOS

## Environment

Set `EXPO_PUBLIC_API_BASE_URL` before starting the app:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000 npm run start
```

The app reads environment values through `expo-constants` and Babel inline env support.

## Notifications And Permissions

Configured permissions include:

- camera
- notifications
- health-data related iOS usage descriptions
- media/photo access for profile updates

## Tests

```bash
npm test
```

The test suite covers:

- Zustand stores
- offline queue and sync
- screen snapshots
- login to dashboard to log-session flow
- language switching

## Builds

Typical Expo build commands:

```bash
npx expo prebuild
npx expo run:android
npx expo run:ios
```

For cloud builds with EAS:

```bash
npx eas build --platform android
npx eas build --platform ios
```
