# CogniPath

CogniPath is a student learning platform with an Express API, MongoDB persistence, and Gemini Developer API-powered roadmap generation, syllabus extraction, resource verification, and streaming tutoring.

## Requirements

- Node.js 20 or later
- npm
- MongoDB Atlas access, or a local MongoDB server

## Setup

Install dependencies from the repository root:

```sh
npm install
```

After copying `backend/.env.example` to `backend/.env`, securely enter a newly created Gemini API key with:

```powershell
.\backend\configure-google-key.ps1
```

Create the key for the Gemini Developer API in Google AI Studio. Gemini API keys usually begin with `AIza`. The key is entered using a masked terminal prompt and written only to the Git-ignored backend env file. Restart the backend after saving it.

The backend reads `backend/.env`. It is ignored by Git. Copy `backend/.env.example` to `backend/.env` and configure `MONGODB_URI`, `GOOGLE_GEMINI_API_KEY`, and `PORT`. The default Gemini model and API base URL can be changed with `GOOGLE_GEMINI_MODEL` and `GOOGLE_GEMINI_API_BASE_URL`.

To use the Atlas cluster, provide its connection string. For a MongoDB server running on this machine, use:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/cognipath_ai
PORT=5000
```

For Atlas, ensure the cluster's network access rules allow your current IP address. Never commit `backend/.env` or share its credentials. The Gemini key is sent only from the backend to Google's Gemini Developer API; do not put it in frontend config.

To provision the first administrator, run `backend/configure-admin-bootstrap.ps1`, restart the backend, then run `backend/bootstrap-admin.ps1`. The first script generates a one-time secret directly into the ignored backend env file; the second prompts for the administrator's name, email, and password. After creation, sign in from the normal login screen; the API refuses to create another active administrator.

Start the frontend and database-backed API together:

```sh
npm run dev
```

The frontend runs through Vite and the API listens on `http://localhost:5000`. The API health endpoint is `http://localhost:5000/api/health`.
