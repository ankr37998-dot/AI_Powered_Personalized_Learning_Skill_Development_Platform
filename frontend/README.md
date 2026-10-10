# CogniPath AI — Student Learning & Resource Verification Platform

CogniPath AI is a personalized learning platform designed entirely for students. It emphasizes strict prerequisite sequencing, interactive learning roadmaps, and official-documentation verification over unvalidated content generation.

---

## Tech Stack & Architecture

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide React icons.
- **Backend:** Node.js, Express.js REST API with Helmet security headers, CORS, and rate limiting.
- **Database:** MongoDB Atlas (Mongoose ODM) configured to `cognipath_ai`.
- **AI Engine:** Google Cloud Vertex AI / Gemini 2.5 Flash SDK (`@google/genai`).
- **Product Model:** Student-Only Application.

---

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the template and configure your local credentials:
```bash
cp .env.example .env
```
Ensure `.env` contains:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.nmemp4s.mongodb.net/cognipath_ai?retryWrites=true&w=majority
API_KEY=your_gemini_api_key
```

### 3. Start Backend Server
```bash
node server/server.js
```
The server will connect to MongoDB Atlas and listen on `http://localhost:5000`.

### 4. Start Frontend
```bash
npm run dev
# or open index.html in a live browser server
```

---

## Features

1. **Interactive Learning Roadmap:** Inspired by roadmap.sh, featuring connected milestone spines, prerequisite dependencies, and an inline topic inspector.
2. **Syllabus Parsing & Review:** Drag-and-drop syllabus ingest with Gemini 2.5 curriculum extraction and editable review.
3. **Verified Resource Directory:** Curated external resources with multi-factor explainable recommendation rankings.
4. **Official Documentation Verification:** Compares claims against canonical Node.js and WHATWG specifications with prompt-injection and SSRF protections.
5. **Real-Time AI Tutor:** Streaming doubt assistant grounded in the active topic context.
6. **Diagnostics & Practice:** Internal assessments scored authoritatively on the backend, with factual subtopic weak-topic analysis.
7. **Persistent Light/Dark Mode:** Apple-inspired themes persisting across browser reloads.
