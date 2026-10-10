# Implementation Plan: CogniPath AI

## Phase Status Summary

- [x] **Phase 0 — Repository inspection & Architecture plan**
  - Formulated schema definitions (`types.ts`), curated Node.js backend path (`constants.ts`), and documentation.

- [x] **Phase 1 — Project Skeleton, Design System, Shared Layouts & Navigation**
  - Implemented responsive Tailwind UI, Sidebar, Topbar, and in-app architecture docs modal (`DocsViewer.tsx`).

- [x] **Phase 2 — Student-Only Access Model**
  - Removed all obsolete Admin and Developer roles, dashboards, and role-switching controls. Established Student as the sole product role.

- [x] **Phase 3 — Syllabus Input, Topic Extraction & Roadmap Generation**
  - Built `SyllabusUploader.tsx` with Gemini 2.5 Flash JSON schema extraction, customizable topic table, and prerequisite graph ordering.

- [x] **Phase 4 — Topic Details, Resource Catalog & Recommendations**
  - Built `ResourceList.tsx` with categorized cards (videos, documentation, articles), freshness dates, and quality scores.

- [x] **Phase 5 — Official Documentation-Based Resource Verification**
  - Built canonical reference library, SSRF-safe content access, Gemini 2.5 strict verification pipeline, claim comparison modal, and 5-scenario evaluation suite.

- [x] **Phase 6 — Real-Time AI Learning Assistant**
  - Built `AiAssistantDrawer.tsx` powered by Gemini 2.5 Flash, grounded in active topic context with doubt suggestion chips and citation references.

- [x] **Phase 7 — Assessments & Evidence-Based Weak-Subtopic Analysis**
  - Built `AssessmentQuiz.tsx` and `WeakTopicAnalysis.tsx` which calculates factual accuracy rates per tagged subtopic without guessing.

- [x] **Phase 8 — Student Learning Experience Redesign**
  - Apple-inspired minimalism + roadmap.sh connected milestone canvas.
  - Functional persistent Light and Dark themes.
  - Fully responsive from 320px to 1920px+ viewports.
