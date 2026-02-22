# Edy on Bike — App Store Publishing Plan (Capacitor)

## Overview

Wrap the existing Next.js web game in Capacitor to publish on iOS App Store and Google Play Store. The game remains a web app rendered in a native WebView — no rewrite needed.

**Bundle ID:** `com.edyonbike.app`
**App Name:** Edy on Bike
**Publisher:** Peter Vidlicka

---

## Stage 1: Next.js Static Export — DONE

- [x] Conditional `output: "export"` in `next.config.ts` (triggered by `CAPACITOR_BUILD=1`)
- [x] `NEXT_PUBLIC_API_URL` env variable — empty for web (relative URLs), set to `https://edyonbike.com` for native builds
- [x] Updated `GameOverScreen.tsx` to use `NEXT_PUBLIC_API_URL` for leaderboard API calls
- [x] `.env.capacitor` created with build-time env vars

**To verify on your machine:** run `npm run build:mobile` and test with `npx serve out`

---

## Stage 2: Capacitor Setup — DONE

- [x] Installed `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`
- [x] Installed plugins: `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/haptics`
- [x] Initialized Capacitor (`capacitor.config.ts`)
- [x] Added iOS and Android native projects
- [x] Configured splash screen (auto-hide, dark background) and status bar (dark overlay)
- [x] Android: locked to landscape in `AndroidManifest.xml`
- [x] iOS: locked to landscape in `Info.plist`, status bar hidden
- [x] Build scripts added to `package.json`:
  - `npm run build:mobile` — static export + cap sync
  - `npm run cap:ios` — open Xcode
  - `npm run cap:android` — open Android Studio
  - `npm run cap:assets` — generate all icons and splash screens

---

## Stage 3: App Icons & Splash Screens — YOUR ACTION NEEDED

The `assets/` directory is set up with the existing 512x512 icon as a placeholder. For best results:

1. **Create a 1024x1024 PNG icon** (no transparency — required by Apple). Place it at:
   - `assets/icon-only.png` — the main app icon
   - `assets/icon-foreground.png` — Android adaptive icon foreground layer
   - `assets/icon-background.png` — Android adaptive icon background (can be solid color)
2. **Optionally create a splash screen** source image (2732x2732 center-aligned logo on dark bg):
   - `assets/splash.png`
   - `assets/splash-dark.png`
3. Run: `npm run cap:assets`
4. Verify icons in `ios/App/App/Assets.xcassets/` and `android/app/src/main/res/mipmap-*/`

---

## Stage 4: iOS — App Store Submission (Manual)

### Prerequisites
- [ ] Apple Developer account ($99/yr) — enroll at developer.apple.com
- [ ] macOS with Xcode installed

### Steps
1. Run `npm run build:mobile` to build and sync
2. Run `npm run cap:ios` to open Xcode
3. In Xcode:
   - Select your team under Signing & Capabilities → enable Automatic Signing
   - Verify bundle ID is `com.edyonbike.app`
   - Set deployment target to iOS 15+
   - Orientation is already locked to landscape
4. Test on Simulator or physical device
5. In App Store Connect (appstoreconnect.apple.com):
   - Create a new app listing
   - Fill in: name, description, keywords, category (Games → Action)
   - Add screenshots (6.7" iPhone, 6.5" iPhone, 12.9" iPad at minimum)
   - Set age rating (4+ expected)
   - **Add a privacy policy URL** (required, even minimal)
6. In Xcode: Product → Archive → Distribute App → App Store Connect
7. Submit for App Review

---

## Stage 5: Android — Google Play Submission (Manual)

### Prerequisites
- [ ] Google Play Developer account ($25 one-time) — play.google.com/console
- [ ] Android Studio installed (or just use the Gradle CLI)

### Steps
1. Run `npm run build:mobile` to build and sync
2. Generate a signing keystore (keep it safe — cannot be changed after publishing):
   ```
   keytool -genkey -v -keystore edyonbike-release.keystore \
     -alias edyonbike -keyalg RSA -keysize 2048 -validity 10000
   ```
3. Configure signing in `android/app/build.gradle` (add signingConfigs block)
4. Build release AAB:
   ```
   cd android && ./gradlew bundleRelease
   ```
5. In Google Play Console:
   - Create app → fill in name, description, category
   - Complete content rating questionnaire
   - Add screenshots and feature graphic
   - **Add a privacy policy URL**
   - Upload AAB (start with internal testing track, then promote to production)
6. Submit for review

---

## Stage 6 (Optional / Future): Auth, IAP & Ads

Implement independently after the app is live in stores.

### 6a. User Accounts
- [ ] Choose auth provider (Firebase Auth or Supabase)
- [ ] Add Google Sign-In + Apple Sign-In (Apple requires it if you offer any social login)
- [ ] Link leaderboard entries to authenticated users
- [ ] Plugins: `@capacitor-firebase/authentication` or native sign-in plugins

### 6b. In-App Purchases
- [ ] Set up RevenueCat account (free tier available)
- [ ] Install `@revenuecat/purchases-capacitor`
- [ ] Configure products in App Store Connect and Google Play Console
- [ ] Implement purchase flow (e.g., unlock biomes, cosmetics)
- [ ] Add restore purchases functionality (required by Apple)

### 6c. Ads
- [ ] Set up AdMob account
- [ ] Install `@capacitor-community/admob`
- [ ] Ad placements: interstitial between sessions, rewarded for bonuses, optional banners
- [ ] Handle ad consent (GDPR / Apple ATT)

---

## Notes

- **Web version stays live** — Vercel deployment continues unchanged. The native app is an additional distribution channel.
- **Shared leaderboard** — both web and native users share the same leaderboard via the Vercel API.
- **Updating the app** — run `npm run build:mobile`, then submit new build to the stores. For minor updates, explore Capacitor live update plugins later.
- **Dev testing** — use `npx cap run ios` / `npx cap run android` for quick on-device testing.
- **CORS** — the Vercel API may need CORS headers added for the native app (requests come from `capacitor://localhost` on iOS and `http://localhost` on Android). Add `Access-Control-Allow-Origin` to the leaderboard route if needed.
