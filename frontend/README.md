# CogniPath AI — Autonomous Personalized Learning & Resource Verification Platform

CogniPath AI is an educational platform for college students and independent developers that emphasizes strict prerequisite sequencing and official-documentation verification over unvalidated content generation.

---

## Tech Stack & Architecture

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide React icons.
- **Backend:** Node.js, Express.js REST API with Helmet security headers, CORS, and rate limiting.
- **Database:** MongoDB Atlas (Mongoose ODM) configured to `cognipath_ai`.
- **AI Engine:** Google Cloud Vertex AI / Gemini 2.5 Flash SDK (`@google/genai`).

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

## In-App Testing & Verification

1. **MongoDB Atlas Status:** Click the **Atlas: cognipath_ai** badge in the top navigation bar to open the live diagnostic modal.
2. **Security & Prerequisite Cycle Suite:** Navigate to **Admin Governance Console ➔ Security Test Suite** and click "Run Security Test Suite" to execute all 8 automated assertions.
3. **Official Docs Verification Benchmark:** Open any resource, click **Verification Audit ➔ Quality Benchmark Suite**, and run the 5-scenario evaluation suite.
