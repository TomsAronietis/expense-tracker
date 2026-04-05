# Deploying Webgoalz Expense Tracker (GitHub Pages + Firebase)

## 1) Create Firebase project
1. Go to Firebase Console and create a project.
2. Add a **Web app** and copy config values.
3. In Authentication, enable **Email/Password** sign-in.
4. Create user:
   - Email: `sia.aronietis@example.com`
   - Password: `tom*Aronietis!2`

## 2) Create Firestore database
1. Create Firestore in production mode.
2. Add security rules from `firebase/firestore.rules`.
3. Publish rules.

## 3) Configure app constants
Open `index.html` and replace `FIREBASE_CONFIG` placeholders:
- `apiKey`
- `authDomain`
- `projectId`
- `appId`

## 4) Deploy to GitHub Pages
1. Push this repo to GitHub.
2. Repo Settings > Pages.
3. Source: Deploy from branch.
4. Branch: your default branch and root `/`.

## 5) Usage
- Username in app: `SIA Aronietis`
- Password: `tom*Aronietis!2`
- Password is validated by Firebase Auth.
- Data is saved to Firestore doc: `workspace_snapshots/webgoalz-brothers`.
