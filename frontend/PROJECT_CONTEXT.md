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
- **State & Data Store:** Client storage engine (`storageService.ts`) with schema validation, prerequisite unlock algorithms, and assessment scoring.
- **Roles:**
  - **Student:** Upload syllabus, edit extracted units, navigate prerequisite-ordered roadmaps, review verification evidence reports, ask doubts via Gemini tutor, take diagnostic quizzes.
  - **Administrator:** Manage the topic and prerequisite catalog, manage resource registry, inspect audit logs, and review potential specification mismatches.

## 4. Key Differentiator: Official Documentation Verification
The platform verifies external educational content against official documentation with 4 specific statuses:
1. `Verified against cited references`
2. `Potential mismatch` (e.g., teaching deprecated `new Buffer()`)
3. `Unable to verify`
4. `Verification failed`

## 5. Architectural Risks & Mitigations
- **Third-Party Video Availability:** Video links can decay or remove transcripts. *Mitigation:* The system reports `unable_to_verify` rather than making up a score or fabricating claims.
- **Hallucinated Citations:** Large language models may invent doc URLs. *Mitigation:* We supply authoritative source domains (nodejs.org, whatwg.org) directly in the model context and enforce strict citation output schemas.
