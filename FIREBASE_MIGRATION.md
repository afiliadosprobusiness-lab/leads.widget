# Firebase Migration Guide

The project has been migrated from Supabase to Firebase.

## Setup Requirements

### 1. Environment Variables (.env)
Fill in the following values in your `.env` file for the Frontend (React):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 2. Server-Side Authentication
The API routes (`api/`) now use `firebase-admin` to access Firestore securely.
For local development and Vercel deployment, you must provide credentials.

**Option A: Service Account JSON (Recommended for Vercel)**
Add a `FIREBASE_SERVICE_ACCOUNT` environment variable containing the minified JSON of your service account key.
1. Go to Firebase Console > Project Settings > Service accounts.
2. Generate new private key.
3. Minify the JSON (remove newlines) and set it as the variable value.

**Option B: Google Application Default Credentials**
If you have the Google Cloud SDK installed locally, run `gcloud auth application-default login` to set up local credentials.

## Data Migration
Your old data is still in Supabase. You need to migrate it to Firestore:
- `user_roles` (Table) -> `user_roles` (Collection)
- `profiles` (Table) -> `profiles` (Collection)
- `widget_configs` (Table) -> `widget_configs` (Collection)
- `leads` (Table) -> `leads` (Collection)
- `payments` (Table) -> `payments` (Collection)
- `blocked_ips` (Table) -> `blocked_ips` (Collection)
- `widget_analytics` (Table) -> `widget_analytics` (Collection)

## Security Rules
Configure your Firestore Security Rules in the Firebase Console. Example basic rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /profiles/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /user_roles/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
    }
    match /widget_configs/{docId} {
      allow read: if true; // Public read needed for widget script
      allow write: if request.auth != null && request.resource.data.user_id == request.auth.uid;
    }
    // ... add rules for other collections
  }
}
```
