# Tyler's Board

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

## Deploying to GitHub Pages

1. Create a GitHub repository (public — required for Pages on a free account)
2. Add all the files in this folder to the repo root: `index.html`, `style.css`, `app.js`, `firebase-config.js`, `firebase-init.js`
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
