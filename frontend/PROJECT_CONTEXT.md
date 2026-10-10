# Project Context: CogniPath AI - Student Learning & Verification Platform

## 1. Product Purpose
CogniPath AI is an autonomous, personalized learning platform designed **entirely for students**.
The application provides exactly one user-facing experience: the **Student experience**.
Developer and administrative maintenance (such as catalog seeding, prerequisite graph management, and server operations) are handled strictly through development scripts and backend services, outside of the student application interface.

## 2. Core Learning Cycle
Syllabus Ingestion → Structured Topic Extraction → Prerequisite Roadmap → Existing Resources → Official Docs Verification → Real-Time Doubt Solving → Diagnostic Practice → Weak Subtopic Analysis → Explainable Recommendation.

## 3. Technology Stack & Integration Architecture
- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide icons.
- **Backend:** Node.js, Express.js REST API with Helmet security headers, CORS, and rate limiting.
- **Database:** MongoDB Atlas (Mongoose ODM) configured to `cognipath_ai`.
- **AI Integration:** Google Vertex AI / Gemini 2.5 Flash SDK (`@google/genai`) using structured JSON response schemas and system instructions.
- **Theme Engine:** Functional Light Mode and Dark Mode with operating-system detection and `localStorage` persistence.
- **Design Inspiration:** Apple Human Interface Guidelines for layout clarity paired with a roadmap.sh-inspired connected milestone learning canvas.

## 4. User Role Model
- **Sole Role:** `student`.
- All newly registered users receive the Student role by default.
- Role switching, admin logins, developer dashboards, and user-management interfaces have been removed from the product code.
- Data access is scoped to the student's own private learning records.
