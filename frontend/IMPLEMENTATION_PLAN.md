# Implementation Plan: CogniPath AI

## Phase Status Summary

- [x] **Phase 0 — Repository inspection & Architecture plan**
  - Formulated schema definitions (`types.ts`), curated Node.js backend path (`constants.ts`), and documentation.

- [x] **Phase 1 — Project Skeleton, Design System, Shared Layouts & Navigation**
  - Implemented responsive Tailwind UI, Navbar, role switcher (Student / Admin), and in-app architecture docs modal (`DocsViewer.tsx`).

- [x] **Phase 2 — Role-Based Access Control**
  - Implemented Student vs Administrator persona modes with segregated catalog controls.

- [x] **Phase 3 — Syllabus Input, Topic Extraction & Roadmap Generation**
  - Built `SyllabusUploader.tsx` with Gemini 2.5 Flash JSON schema extraction, customizable topic table, and prerequisite graph ordering.

- [x] **Phase 4 — Topic Details, Resource Catalog & Recommendations**
  - Built `ResourceList.tsx` with categorized cards (videos, documentation, articles), freshness dates, and quality scores.

- [x] **Phase 5 — Official Documentation-Based Resource Verification**
  - Built `geminiService.verifyResourceAgainstOfficialDocs` and `VerificationModal.tsx` showing claim-by-claim audits, official standard links, and evidence gaps.

- [x] **Phase 6 — Real-Time AI Learning Assistant**
  - Built `AiAssistantDrawer.tsx` powered by Gemini 2.5 Flash, grounded in active topic context with doubt suggestion chips and citation references.

- [x] **Phase 7 — Assessments & Evidence-Based Weak-Subtopic Analysis**
  - Built `AssessmentQuiz.tsx` and `WeakTopicAnalysis.tsx` which calculates factual accuracy rates per tagged subtopic without guessing.

- [x] **Phase 8 — Administrator Tools & Governance Console**
  - Built `AdminDashboard.tsx` for adding catalog topics, editing prerequisites, and auditing resource registry status.
