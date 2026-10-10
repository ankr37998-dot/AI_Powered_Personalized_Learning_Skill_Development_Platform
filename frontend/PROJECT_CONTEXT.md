# Project Context: CogniPath AI - Personalized Learning & Verification Platform

## 1. Product Overview
CogniPath AI is an educational platform designed for college students and independent learners.
The core philosophy is **student control, strict prerequisite-ordered progression, and official-documentation verification**.
Unlike generic chatbots that generate unverified content, CogniPath organizes curated existing learning resources (YouTube videos, official documentation, technical articles, and MCQs) and benchmarks their claims directly against official runtime standards (e.g., Node.js API docs, WHATWG specifications).

## 2. Core Learning Cycle
Syllabus Ingestion → Structured Topic Extraction → Prerequisite Roadmap → Existing Resources → Official Docs Verification → Real-Time Doubt Solving → Diagnostic Practice → Weak Subtopic Analysis → Explainable Recommendation.

## 3. Technology Stack & Integration Architecture
- **Frontend:** React 18+ (TSX), Tailwind CSS, Lucide icons.
- **AI Integration:** Google Vertex AI / Gemini 2.5 Flash SDK (`@google/genai`) using structured JSON response schemas and system instructions.
- **Admin & Platform Governance (`services/adminService.ts`):**
  - Role-enforced authorization (`adminService.assertAdmin`). Students rejected with 403 Forbidden.
  - DFS graph cycle detection preventing direct self-dependencies and multi-node circular chains (e.g., `A ➔ B ➔ C ➔ A`).
  - Last-active administrator protection against demotion or account suspension.
  - Topic dependency audits blocking accidental deletion of topics referenced by resources or roadmaps.
  - Automated security test suite runner (`services/adminTestRunner.ts`).

## 4. Roles Implemented
- **Student:** Upload syllabus, edit extracted units, navigate prerequisite-ordered roadmaps, review verification evidence reports, ask doubts via Gemini tutor, take diagnostic quizzes.
- **Administrator:** Manage the topic and prerequisite catalog, manage resource registry, inspect audit logs, review reported broken links, and manage user accounts.
- **No Faculty Role:** Faculty dashboards, cohorts, or instructor-management workflows are explicitly omitted per architecture specification.
