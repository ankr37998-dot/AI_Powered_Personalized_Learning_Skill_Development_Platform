# CogniPath Frontend

React and TypeScript interface for CogniPath. User accounts and assessment attempts are handled by the Express/Mongoose API in the sibling `backend` workspace.

## Development

From the repository root, configure `backend/.env` using `backend/.env.example`, install dependencies, then run:

```sh
npm install
npm run dev
```

The Vite client uses `http://localhost:5000` for API requests. The frontend does not need database credentials.

## Learning tools

Uploaded syllabus extraction, personalized roadmap generation, streaming AI tutoring, and resource verification call the backend's Gemini Developer API proxy. Manual topic entry stays local. Google Gemini credentials are configured only in the ignored `backend/.env` file and are never needed by the frontend.
