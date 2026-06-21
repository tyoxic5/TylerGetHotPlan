# Tyler's Board

A personal body & habit tracker — weight, body fat %, calories/macros, exercise logging, water intake, skincare, journaling, and meditation, plus a motivational quote/photo banner. Built as a plain static site (no build step) so it deploys straight to GitHub Pages.

## What it tracks

- **Today** — dashboard with a motivational quote/photo banner, today's calorie and water progress, last weigh-in, and today's training focus
- **Body** — weight + body fat % log with a trend chart
- **Food** — quick-add buttons for Meal A / Meal B / the daily smoothie (pre-loaded from your meal plan macros), plus custom entries, with live macro progress
- **Train** — pre-loaded exercise lists for Upper / Lower / Full Body days, with sets/reps/weight logging and a "last session" reference for progressive overload
- **Habits** — water intake counter, AM/PM skincare checklist, a meditation timer + log, and a journal

## How data is stored

Everything is saved in your browser's `localStorage` — there's no server or account. That means:
- Your data stays on whatever device/browser you use the app on (it won't sync between your phone and laptop automatically)
- Clearing your browser data/cache will erase it, so don't do that without exporting first if this matters to you
- Photos are automatically resized/compressed on upload to keep storage usage low, but avoid uploading dozens of large images

If you want cross-device sync later (similar to what you set up for the iHotel conference room app with Firebase), that's a reasonable next step — just say so and we can wire it in.

## Deploying to GitHub Pages

1. Create a new GitHub repository (public or private both work for Pages on a personal account)
2. Add these three files to the repo root: `index.html`, `style.css`, `app.js`
3. Commit and push
4. In the repo, go to **Settings → Pages**
5. Under **Build and deployment**, set **Source** to "Deploy from a branch"
6. Choose the **main** branch and the **/ (root)** folder, then **Save**
7. GitHub gives you a URL like `https://yourusername.github.io/repo-name/` — that's your live app, usually live within a minute or two

## Editing the plan data

If your workout days, meal macros, or targets change, edit the top of `app.js`:

- `DAY_EXERCISES` — the exercises/sets for Upper/Lower/Full Body days
- `MEALS` — the quick-add meal buttons and their macros
- `TARGETS` — your daily calorie/macro/water targets
- `SKINCARE_AM` / `SKINCARE_PM` — your skincare routine steps

No other code needs to change for those updates.
