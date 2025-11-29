# Symptom Severity Checker — Firebase (Static + Firestore)

## What this project contains

- `index.html` — User-facing app: Google Sign-In, ask age, load questions from Firestore, compute severity, store responses (name, email, age, answers, severity, timestamp).
- `admin.html` — Admin dashboard: Google Sign-In, only accessible to admin emails in `admins` collection. Manage questions (Add / Edit / Delete) and view/export responses.
- `firebase.js` — Firebase initialization and helper functions. Replace config with your project's config.
- `styles.css` — Shared dark-mode + bootstrap-compatible overrides.

## Firebase setup steps (quick)

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Authentication > Sign-in method > Google** (enable).
3. Create a Firestore database (in production mode or test mode during development).
4. In Firestore create collections:
   - `questions` (documents with fields: `text` string, `options` array of objects `{text: string, value: number}`, `createdAt` timestamp)
   - `responses` (will be written by the app)
   - `admins` (create a document whose ID is the admin email, e.g. `subhirs2468@gmail.com`, with `{ role: 'admin' }`)
5. Replace the Firebase config object in `firebase.js` with your project credentials (from Project Settings > SDK setup).
6. Optional: Configure Firebase Hosting if you want to publish directly from the Firebase CLI.

## Security & rules (recommended)

Start with these simple Firestore rules for early testing (in Security rules):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read questions
    match /questions/{doc} {
      allow read: if request.auth != null;
      allow write: if false; // admin writes via admin panel (client) which will check admin role manually
    }

    match /responses/{doc} {
      allow create: if request.auth != null;
      allow read: if false; // read allowed only for admin via server or client after admin verification
      allow update, delete: if false;
    }

    match /admins/{doc} {
      allow read: if request.auth != null && request.auth.token.email == doc; // rough check
      allow write: if false;
    }
  }
}
```

> These are basic — for production you should make stronger rules and/or use callable cloud functions to authorize admin actions.

## Running locally

- Open `index.html` in your browser or serve via a static server.
- For Firestore access from `file://` you may need to serve via `npx http-server` or similar to avoid CORS issues.

## Deploying

- Use GitHub Pages / Netlify / Firebase Hosting. If you use Firebase Hosting, install Firebase CLI and run `firebase deploy --only hosting` after setting up `firebase.json`.
