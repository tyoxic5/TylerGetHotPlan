# Level Up

A personal body & habit tracker — weight, body fat %, calories/macros, exercise logging, water intake, skincare, journaling, and meditation, plus a motivational quote/photo banner. Hosted as a static site on GitHub Pages, with Firebase handling auth + cloud backup.

## How data flows

- Every action (logging a meal, checking off skincare, etc.) saves **instantly to your browser's localStorage** — fast, works offline, no network dependency.
- **"Log Workout"** additionally pushes that session to the cloud right away.
- **"End Day"** pushes everything else (nutrition, water, skincare, meditation, journal, weigh-ins) to the cloud in one shot.
- On sign-in (any device, any browser), the app pulls your latest cloud data down and rebuilds local state from it.

This means: if you clear your browser, switch devices, or your phone updates and wipes app data, your history survives — as long as you've hit "End Day" since your last meaningful update. If you forget, the worst case is losing whatever's only-local since the last sync — never everything.

**Until you set up Firebase (see below), the app runs in local-only mode automatically** — fully functional, just without cloud backup. Nothing breaks if you skip this section for now.

## Setting up Firebase (one-time, ~10 minutes)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project (free "Spark" plan — no credit card required, and this plan literally cannot incur charges).
2. In the project, go to **Build → Authentication**. Click **Get Started**, then enable the **Email/Password** sign-in method.
3. Go to **Build → Firestore Database**. Click **Create Database**, choose a region close to you, and start in **production mode**.
4. Once created, go to the **Rules** tab and replace the default rules with:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/data/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

   This locks the database down so you can only ever read or write your own data — nobody else's, not even with a stolen API key (see "Is this actually secure?" below).

5. Go to **Project Settings** (gear icon, top left) → scroll to **Your apps** → click the **Web** icon (`</>`) → register an app (any nickname is fine, you don't need Firebase Hosting).
6. Firebase will show you a config object. Copy those six values into `firebase-config.js` in this project, replacing the placeholders.
7. Push the updated files to your GitHub repo. Reload your Pages site — you should see a sign-in screen. Use **Create Account** once with your own email/password, and you're set.

## Is this actually secure?

The values in `firebase-config.js` are **not secret** — they're meant to be public, and Firebase is designed around that. The actual security comes from two things working together:

- **Authentication** — only someone who knows your email/password can sign in at all.
- **Firestore Security Rules** (step 4 above) — even a signed-in, authenticated request can only touch the document at `users/{their-own-uid}/...`. There's no way to read or write anyone else's data, regardless of what's visible in the page source.

This is the standard pattern for static-site-plus-database apps — it's not a workaround, it's how Firebase is meant to be used.

## What doesn't sync (by design, for now)

Motivational photos stay local-only — they're not pushed to Firestore. Firestore documents cap out at 1 MiB, and even a few compressed photos would eat into that fast. If you want photos to follow you across devices too, that's a small additional piece (Firebase Storage) — just ask if you want it added.

## Installing as a fullscreen app on your phone

The site is set up as a proper installable web app — icon, branded name, and fullscreen display, no browser bar.

**iPhone (Safari) — this MUST be done from the Safari app specifically:**
1. Open your Pages URL in **Safari** — not Chrome, not any other browser
2. Tap the **Share** icon (square with an arrow)
3. Scroll down, tap **Add to Home Screen**
4. Tap **Add**

Why Safari specifically: every browser on iOS (including Chrome) is required by Apple to run on Safari's underlying engine, but Apple only gives the full "Add to Home Screen" treatment — reading your icon files, the manifest, launching fullscreen — to Safari itself. Chrome's "Add to Home Screen" on iPhone just creates a plain bookmark; it won't pick up the icon or the fullscreen behavior at all. If you've already added it from Chrome, delete that shortcut and re-add from Safari.

Note on iOS specifically: Apple doesn't give web apps a way to hide the status bar entirely the way a native app can, so you'll still see the clock/battery up top even though the browser bar is gone. That's an iOS limitation, not a bug — it's the closest thing to fullscreen Safari allows for web apps.

**Android (Chrome):**
1. Open your Pages URL in Chrome
2. Tap the **⋮** menu (top right)
3. Tap **Add to Home screen** (or you may see an **Install app** banner automatically — tap that instead if it shows up)
4. Tap **Install**

Android fully honors fullscreen mode — the status bar hides too, true edge-to-edge.

Either way, it'll sit on your home screen with its own icon and "Level Up" name, and open without any browser UI.

### Optimized for iPhone 16 Pro Max (and any notch/Dynamic Island device)

Rather than hardcoding pixel values for one specific phone, the layout uses iOS's `env(safe-area-inset-*)` CSS variables — these are populated automatically by the OS with the exact clearance needed around the Dynamic Island and the home indicator, for whatever device it's running on. That means it's correctly laid out for the 16 Pro Max specifically without needing 16-Pro-Max-specific code, and it'll stay correct on whatever iPhone you have next, too.

The apple-touch-icon is a plain full-bleed square with no rounded corners baked in — that's intentional and matches Apple's own guidance. iOS applies its own corner mask to home screen icons; feeding it an icon you've already rounded yourself can create faint double-edges. The Android manifest icons keep their rounded corners, since Android's install flow handles that differently.

## Editing the icon

There are two source files in `icons/`:
- `icon-source.svg` — rounded corners, used to generate the Android/manifest icons (`icon-192.png`, `icon-512.png`)
- `icon-source-square.svg` — full-bleed square, used to generate the `apple-touch-icon-*.png` files

Both contain the same glyph — only the background shape differs. If you tweak the design, edit the glyph identically in both files, then re-export PNGs at these sizes: 512, 192 (from the rounded version) and 180, 167, 152, 120 (from the square version), plus 32, 16 favicons (either works). Any image editor or online SVG-to-PNG converter can do this.

## Deploying to GitHub Pages

1. Create a GitHub repository (public — required for Pages on a free account)
2. Add all the files and folders in this directory to the repo root: `index.html`, `style.css`, `app.js`, `firebase-config.js`, `firebase-init.js`, `manifest.json`, and the entire `icons/` folder
3. Commit and push
4. In the repo, go to **Settings → Pages**
5. Under **Build and deployment**, set **Source** to "Deploy from a branch", choose **main** and **/ (root)**, then **Save**
6. Your site goes live at `https://yourusername.github.io/repo-name/`, usually within a minute or two

## Editing the plan data

If your workout days, meal macros, or targets change, edit the top of `app.js`:

- `DAY_EXERCISES` — the exercises/sets for Upper/Lower/Full Body days
- `MEALS` — the quick-add meal buttons and their macros
- `TARGETS` — your daily calorie/macro/water targets
- `SKINCARE_AM` / `SKINCARE_PM` — your skincare routine steps

No other code needs to change for those updates.
