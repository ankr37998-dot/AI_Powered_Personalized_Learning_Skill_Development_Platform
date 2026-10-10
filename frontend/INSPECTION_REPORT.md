# Repository Inspection & Architectural Audit Report
**Date:** February 2025  
**Platform:** CogniPath AI - Personalized Learning & Verification Platform  
**Target:** Alignment with Product Vision, Verification Integrity, and MERN/Vertex AI Requirements  

---

## 1. Which screens and features are actually implemented?

The following screens and functional modules are implemented in the React SPA:

| Module / Screen | Implementation File | Status | Notes |
|---|---|---|---|
| **Student Roadmap Dashboard** | `components/RoadmapView.tsx` | **Implemented** | Sequential node graph with status badges (`Completed`, `Active`, `Revision Needed`, `Locked`). Enforces prerequisites. |
| **Syllabus Ingestion & Extraction** | `components/SyllabusUploader.tsx` | **Implemented** | Input textarea + preset loader + real Gemini 2.5 Flash topic extraction + editable review table (edit titles, modules, descriptions, confidence, add/remove topics). |
| **Curated Resource Directory** | `components/ResourceList.tsx` | **Implemented** | Categorized cards (video, documentation, article, practice), type/status filtering, links to official documentation authority. |
| **Official Docs Verification Modal** | `components/VerificationModal.tsx` | **Implemented** | Shows claim-by-claim comparisons against official documentation, match status (`aligned`, `deviates`), and scope limitations. |
| **Contextual AI Learning Assistant** | `components/AiAssistantDrawer.tsx` | **Implemented** | Slide-out doubt solver drawer with active topic context grounding, doubt suggestion chips, and official doc citations. |
| **Diagnostic Assessments & Quizzes** | `components/AssessmentQuiz.tsx` | **Implemented** | Multiple-choice questions tagged with discrete subtopics, explanation rationales, and official doc citations. Updates roadmap scores and unlocks dependent nodes. |
| **Weak-Subtopic Analysis** | `components/WeakTopicAnalysis.tsx` | **Implemented** | Computes accuracy per subtopic strictly from quiz attempts. Displays "Insufficient Evidence" when data is lacking. Produces explainable next-action recommendations. |
| **Topic Details Modal** | `components/TopicDetailsModal.tsx` | **Implemented** | Deep view of key competencies, prerequisite dependencies, official authority URLs, and direct practice triggers. |
| **Broken Resource / Discrepancy Reporting** | `components/ReportResourceModal.tsx` | **Implemented** | Allows students to flag 404 links, outdated APIs, or misleading content for admin review. |
| **Student Profile & Learning Goals** | `components/StudentProfileModal.tsx` | **Implemented** | Editable student name, learning goal/target exam, current skill level, and code dialect. |
| **Admin Governance Console** | `components/AdminDashboard.tsx` | **Implemented** | 5 sub-modules: (1) Topic & Prerequisite Catalog Management, (2) Resource Metadata, (3) Reported Issues / Broken Links Review, (4) User Account Management, (5) Platform Configurations. |
| **Architecture Documentation Modal** | `components/DocsViewer.tsx` | **Implemented** | In-app inspection of `PROJECT_CONTEXT.md`, `IMPLEMENTATION_PLAN.md`, and `INSPECTION_REPORT.md`. |

---

## 2. Which values are hardcoded or mock data?

| Field / Metric | Source & Hardcoded vs Dynamic Status |
|---|---|
| **Student Name & Target Goal** | **Initial Mock / Persistent State:** Defaults to `"Alex Rivera"` (`usr_student_01`) targeting `"Master Production Node.js Architecture..."` stored in `storageService.ts`. Can be updated by the student via `StudentProfileModal` and saved to `localStorage`. |
| **Roadmap Mastery Percentage** | **Computed Dynamically:** Evaluated in `Navbar.tsx` as `Math.round((completedTopicsCount / totalTopicsCount) * 100)`. Updates immediately when quiz attempts are completed. |
| **Topic Status & Diagnostic Scores** | **Initial Seed + Dynamic Updates:** Initial state in `storageService.ts` contains seed scores (`85%`, `60%`, `40%`, `locked`). Submitting quizzes through `AssessmentQuiz.tsx` calculates real scores, transitions node statuses (`completed` if $\ge 75\%$, `needs_revision` if $< 50\%$), and recalculates prerequisite unlocks. |
| **Verification Badges** | **Seed Records + Live AI Verifiable:** Previously, mock seed resources in `constants.ts` were pre-labeled with `verified_against_cited_references`. Under strict audit standards, resources without an executed live inspection must be labeled `unable_to_verify` or `pending_verification` until an actual verification run executes. |

---

## 3. Is the syllabus upload and extracted-topic review flow functional?

**Yes, it is functional end-to-end:**
1. **Input:** Student enters raw text or loads the CS-302 Node.js syllabus preset.
2. **AI Extraction:** Calls `geminiService.extractTopicsFromSyllabus()` using Google GenAI SDK (`gemini-2.5-flash`) with strict JSON schema enforcing `id`, `title`, `unitOrModule`, `description`, `confidence`, and `prerequisites`.
3. **Editable Review:** The student can edit titles, module names, descriptions, remove topics, or add custom topics.
4. **Roadmap Generation:** Clicking "Confirm & Generate Roadmap" transforms extracted topics into ordered roadmap nodes, locks topics whose prerequisites are not met, saves the roadmap into `localStorage`, and opens the updated Roadmap view.

---

## 4. Are resource verification and the AI chatbot connected to real backend services, or are they only visual placeholders?

- **Real Integration (Client-side Vertex AI SDK):** Both are connected directly to the `@google/genai` SDK using `process.env.API_KEY` with `vertexai: true`:
  - **AI Doubt Solver:** Executes `ai.models.generateContent` on `gemini-2.5-flash` with topic grounding, conversational history, and official specification citations.
  - **Resource Verification:** Executes `ai.models.generateContent` on `gemini-2.5-flash` with a structured `responseSchema` auditing claims against official runtime authorities.
- **Backend Architecture Note:** The calls currently originate from the frontend client services (`services/geminiService.ts`) rather than an Express/Node.js proxy. In production deployment, these functions belong in Node/Express route handlers (`/api/ai/verify`, `/api/ai/chat`) to protect credentials and enforce server-side rate limits.

---

## 5. Is authentication and admin authorization enforced by the backend?

**No:**
- The current implementation provides a **simulated client-side role toggle** (`Student` vs `Admin`) in `Navbar.tsx` and `storageService.ts`.
- There is no Express.js REST backend, bcrypt password hashing, or JWT token validation running in this browser SPA runtime.
- Admin views and Student views are switched via UI state; server-level route guards are not yet enforced by a standalone backend server.

---

## 6. Smallest Next Implementation Step (Accepted Task)

**Objective: Resource Data Integrity & Strict Evidence Enforcement**
1. **Remove fabricated verification badges:** Ensure resources without a completed verification report are explicitly tagged `unable_to_verify` ("Audit Pending").
2. **Add Data Provenance tags:** Clearly distinguish "Curated Catalog Resource" from "Live-Audited by Vertex AI".
3. **Add In-App Inspection Tab:** Integrate this `INSPECTION_REPORT.md` into `DocsViewer.tsx` so users and reviewers can inspect platform status directly from the UI.
4. **Enable 1-Click Live Verification:** Ensure students and admins can click "Verify vs Docs" on any unverified resource to run a live Gemini check and attach claim evidence.
