# CogniPath AI — Fully AI-Generated Learning Roadmaps for Any Skill
**Feature:** Autonomous Vertex AI Curriculum Synthesis & Multi-Roadmap Engine  
**AI Model:** Google Vertex AI / Gemini 2.5 Flash (`@google/genai`)  
**Status:** Completed, Integrated & Tested  

---

## 1. Overview of Implementation

The platform has been upgraded from static or syllabus-only roadmaps into a **flexible, real-time AI roadmap generation engine** that supports any student learning goal:

1. **Four Goal Ingestion Paths (`components/CreateRoadmapModal.tsx`):**
   - **Learn a New Skill:** Natural language goal (e.g. *Android with Kotlin & Jetpack Compose*, *React with TypeScript*, *Machine Learning with PyTorch*).
   - **Career Target:** Role-oriented curriculum (e.g. *Backend Engineer with Java & Spring Boot*, *Cloud Platform Engineer*).
   - **College Subject:** Direct syllabus input or uploaded curriculum files.
   - **Custom Goal:** Free-form learning objectives with personalized constraints.

2. **Personalization Factors Collected:**
   - Starting skill level: `beginner`, `intermediate`, or `advanced`.
   - Prior knowledge or completed prerequisites.
   - Available study time per week (2 to 40 hours).
   - Pedagogical focus: `comprehensive`, `project_oriented`, `interview_prep`, or `exam_prep`.

3. **Real Google Vertex AI / Gemini 2.5 Flash Synthesis (`services/geminiService.ts`):**
   - Structured JSON schema enforcing `title`, `description`, `totalEstimatedHours`, `phases`, and `topics`.
   - Generates 3 to 5 logical phases with milestone projects.
   - Generates concrete technical topics with unique IDs, study hour estimates, learning objectives, and 2-3 key competencies.

4. **Server/Service-Side Graph Validation (DFS Cycle Guard):**
   - Eliminates self-dependencies and invalid topic references.
   - Uses Depth-First Search (DFS) graph traversal to detect and remove circular dependency chains automatically.
   - Guarantees at least one reachable starting node with empty prerequisites.

5. **Student Review & Customization Before Confirmation:**
   - Editable tree preview allowing students to rename topics, delete unwanted topics, inspect study hour milestones, and adjust weekly pace before saving.

6. **Multiple Saved Roadmaps Management (`services/storageService.ts`):**
   - `getSavedRoadmaps()`, `saveRoadmap()`, `getActiveRoadmapId()`, `setActiveRoadmapId()`.
   - Students can maintain multiple concurrent roadmaps (e.g. Android + SQL + Node.js) with independent progress tracking without overwriting existing data.
   - Interactive roadmap switcher strip integrated into `RoadmapView.tsx`.

7. **Honest Resource Discovery State:**
   - When a newly generated skill topic has no catalog entry in the curated database, the Topic Inspector explicitly states that catalog entries are pending and prompts the student to use the **AI Tutor** or explore official specs, avoiding fabricated URLs.

---

## 2. Verification Checklist

| Verification Requirement | Status | Evidence |
|---|---|---|
| **AI Roadmap for Any Skill** | **VERIFIED** | `geminiService.generatePersonalizedRoadmap()` with Gemini 2.5 Flash. |
| **Preset Suggestions Available** | **VERIFIED** | Quick-fill chips for Android, React, Spring Boot, DSA, SQL, ML. |
| **DFS Cycle Detection** | **VERIFIED** | Automatic graph traversal stripping circular prerequisite edges. |
| **Editable Preview Step** | **VERIFIED** | `components/CreateRoadmapModal.tsx` step='preview'. |
| **Multiple Saved Roadmaps** | **VERIFIED** | Multi-roadmap switcher strip in `components/RoadmapView.tsx`. |
| **Prerequisite Progress Unlocking** | **VERIFIED** | Node status gates dynamically based on $\ge 75\%$ diagnostic score. |
| **Preservation of Student Workspace** | **VERIFIED** | All student learning workflows intact; no admin or developer interfaces. |
