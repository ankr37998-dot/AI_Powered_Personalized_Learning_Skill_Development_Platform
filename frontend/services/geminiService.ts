import { GoogleGenAI, Type } from '@google/genai';
import {
  ExtractedTopic,
  VerificationReport,
  CreateRoadmapPayload,
  SavedRoadmap,
  RoadmapNode,
  RoadmapPhase
} from '../types';

export const geminiService = {
  getAiClient() {
    return new GoogleGenAI({
      apiKey: process.env.API_KEY,
      vertexai: true
    });
  },

  /**
   * Generates a fully personalized, goal-specific learning roadmap using Vertex AI Gemini 2.5 Flash
   * Supports any skill, career target, or custom goal with strict prerequisite ordering & phase milestones
   */
  async generatePersonalizedRoadmap(
    payload: CreateRoadmapPayload,
    studentId: string = 'usr_student_01'
  ): Promise<SavedRoadmap> {
    if (!payload.goalTitle || !payload.goalTitle.trim()) {
      throw new Error('Please enter a specific learning goal or skill.');
    }

    const ai = this.getAiClient();

    const focusInstruction = {
      project_oriented: 'Focus heavily on hands-on application architecture, production patterns, and concrete milestone projects.',
      interview_prep: 'Emphasize algorithmic efficiency, data flow, concurrency edge cases, and high-frequency technical interview questions.',
      exam_prep: 'Structure systematically around theoretical models, definitions, runtime mechanics, and academic syllabus standards.',
      comprehensive: 'Deliver a balanced, complete engineering progression from fundamentals to enterprise-grade mastery.'
    }[payload.targetFocus] || 'Comprehensive mastery.';

    const prompt = `You are a world-class principal curriculum engineer and technical learning roadmap designer.
Generate a structured, highly personalized learning roadmap for this student's specific goal.

STUDENT PROFILE & REQUEST:
- Category: ${payload.category}
- Learning Goal: "${payload.goalTitle.trim()}"
- Student Details & Context: "${payload.goalDescription || 'None provided'}"
- Current Skill Level: ${payload.skillLevel}
- Prior Knowledge: "${payload.priorKnowledge || 'None specified'}"
- Available Study Time: ${payload.weeklyHours} hours per week
- Target Pedagogical Focus: ${focusInstruction}
${payload.syllabusContent ? `\nReference Syllabus/Curriculum Text:\n${payload.syllabusContent}\n` : ''}

CRITICAL RULES:
1. Make the topic sequence tailored to THIS EXACT SKILL/GOAL. (e.g. Android must cover Kotlin, Jetpack Compose, Coroutines, StateFlow, Room, Architecture; SQL must cover Relational Design, Joins, Indexing, Query Optimization).
2. Group topics into 3 to 5 logical PHASES (e.g. Phase 1: Foundations, Phase 2: Core Architecture, etc.).
3. Each topic MUST have:
   - "id": A unique snake_case identifier (e.g. "topic_kotlin_basics", "topic_compose_state").
   - "title": Clean, professional title.
   - "phaseId": Matching the parent phase ID.
   - "description": 1-2 sentence learning objective of what the student will be able to build or explain.
   - "prerequisites": Array of topic IDs that MUST strictly be learned before this topic. The first 1-2 foundational topics must have EMPTY prerequisites so the learner can start immediately.
   - "estimatedHours": Realistic study hours based on student's skill level.
   - "keyCompetencies": Array of 2-3 specific subtopics or skills mastered.
4. ABSOLUTELY NO CIRCULAR DEPENDENCIES (if Topic B requires Topic A, Topic A cannot require Topic B).
5. Never invent generic placeholder titles like "Topic 1" or "Phase 1 Topic". Make every topic concrete and technically rich.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a senior engineering curriculum architect. Output valid JSON strictly conforming to the requested schema. Ensure prerequisite graphs are strictly acyclic.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Engaging, professional roadmap title' },
            description: { type: Type.STRING, description: 'Summary of the learning path and target competencies' },
            totalEstimatedHours: { type: Type.NUMBER, description: 'Total study hours for complete path' },
            phases: {
              type: Type.ARRAY,
              description: '3 to 5 logical phases',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  order: { type: Type.NUMBER },
                  estimatedWeeks: { type: Type.NUMBER },
                  milestoneProject: { type: Type.STRING, description: 'Practical milestone project for this phase' }
                },
                required: ['id', 'title', 'description', 'order']
              }
            },
            topics: {
              type: Type.ARRAY,
              description: 'Ordered list of concrete technical topics',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  phaseId: { type: Type.STRING },
                  description: { type: Type.STRING },
                  prerequisites: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  estimatedHours: { type: Type.NUMBER },
                  keyCompetencies: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ['id', 'title', 'phaseId', 'description', 'prerequisites']
              }
            }
          },
          required: ['title', 'description', 'totalEstimatedHours', 'phases', 'topics']
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Vertex AI returned an empty response payload. Please check API quota or network connectivity.');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      throw new Error('Failed to parse structured JSON response from Vertex AI roadmap generator.');
    }

    if (!parsed.topics || !Array.isArray(parsed.topics) || parsed.topics.length === 0) {
      throw new Error('Model did not return valid topics for this learning goal.');
    }

    // -------------------------------------------------------------
    // Post-Generation Validation: Cycle Detection & Graph Sanitization
    // -------------------------------------------------------------
    const rawTopics: any[] = parsed.topics;
    const rawPhases: any[] = parsed.phases || [];
    const validTopicIds = new Set<string>(rawTopics.map((t) => t.id));

    // DFS Cycle Detection & Sanitization
    const sanitizedNodes: RoadmapNode[] = [];
    const sanitizedPrereqMap = new Map<string, string[]>();

    for (const t of rawTopics) {
      // Filter out self-dependencies or non-existent IDs
      const cleanPrereqs = (t.prerequisites || []).filter(
        (pid: string) => pid !== t.id && validTopicIds.has(pid)
      );
      sanitizedPrereqMap.set(t.id, cleanPrereqs);
    }

    // Validate acyclicity for each node using DFS
    for (const [nodeId, prereqs] of sanitizedPrereqMap.entries()) {
      const filteredPrereqs: string[] = [];

      for (const pId of prereqs) {
        // Check if there is already a path from pId to nodeId (which would form a cycle)
        const visited = new Set<string>();
        const hasPath = (curr: string, target: string): boolean => {
          if (curr === target) return true;
          visited.add(curr);
          const nexts = sanitizedPrereqMap.get(curr) || [];
          for (const n of nexts) {
            if (!visited.has(n) && hasPath(n, target)) return true;
          }
          return false;
        };

        if (hasPath(pId, nodeId)) {
          console.warn(`[Cycle Guard] Removed circular prerequisite: ${nodeId} -> ${pId}`);
        } else {
          filteredPrereqs.push(pId);
        }
      }
      sanitizedPrereqMap.set(nodeId, filteredPrereqs);
    }

    // Build RoadmapNodes
    rawTopics.forEach((t, idx) => {
      const prereqs = sanitizedPrereqMap.get(t.id) || [];
      const isStartNode = prereqs.length === 0;

      const parentPhase = rawPhases.find((p) => p.id === t.phaseId);
      const unitName = parentPhase ? parentPhase.title : `Module ${Math.floor(idx / 3) + 1}`;

      sanitizedNodes.push({
        topicId: t.id,
        title: String(t.title || `Topic ${idx + 1}`).trim(),
        unit: unitName,
        phaseId: t.phaseId || rawPhases[0]?.id,
        status: isStartNode ? 'available' : 'locked',
        order: idx + 1,
        prerequisitesMet: isStartNode,
        estimatedHours: t.estimatedHours || Math.max(3, Math.round(payload.weeklyHours / 2)),
        learningObjective: t.description || 'Master core competency and practical patterns.',
        keyCompetencies: Array.isArray(t.keyCompetencies) ? t.keyCompetencies : []
      });
    });

    // Ensure at least the very first node is unlocked if none were
    if (!sanitizedNodes.some((n) => n.status === 'available')) {
      sanitizedNodes[0].status = 'available';
      sanitizedNodes[0].prerequisitesMet = true;
    }

    // Build RoadmapPhases
    const formattedPhases: RoadmapPhase[] = rawPhases.map((p, idx) => {
      const phaseTopics = sanitizedNodes.filter((n) => n.phaseId === p.id).map((n) => n.topicId);
      return {
        id: p.id || `phase_${idx + 1}`,
        title: p.title || `Phase ${idx + 1}`,
        description: p.description || '',
        order: p.order || idx + 1,
        estimatedWeeks: p.estimatedWeeks || Math.ceil(sanitizedNodes.length / 2),
        milestoneProject: p.milestoneProject,
        topicIds: phaseTopics
      };
    });

    const roadmapId = `roadmap_${payload.goalTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24)}_${Date.now()}`;

    return {
      id: roadmapId,
      studentId,
      title: parsed.title || payload.goalTitle,
      category: payload.category,
      description: parsed.description || `Personalized learning roadmap for ${payload.goalTitle}.`,
      targetFocus: payload.targetFocus,
      skillLevel: payload.skillLevel,
      weeklyHours: payload.weeklyHours,
      totalEstimatedHours: parsed.totalEstimatedHours || sanitizedNodes.reduce((acc, n) => acc + (n.estimatedHours || 4), 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      phases: formattedPhases,
      nodes: sanitizedNodes
    };
  },

  /**
   * Extracts syllabus subjects, topics, and prerequisites from raw syllabus text using Vertex AI / Gemini 2.5 Flash
   */
  async extractTopicsFromSyllabus(rawText: string): Promise<ExtractedTopic[]> {
    if (!rawText || rawText.trim().length === 0) {
      throw new Error('Syllabus input text is empty. Please enter or upload valid curriculum text.');
    }

    const ai = this.getAiClient();
    const prompt = `Analyze this syllabus or curriculum document and extract structured subjects/units and discrete topics.
Identify:
1. "unitOrModule": The chapter, unit, or module name (e.g. "Module 1: Architecture").
2. "title": A clear, concise technical topic title.
3. "description": A 1-2 sentence description of competencies or runtime mechanics taught.
4. "confidence": 'high' if the topic clearly maps to standard computer science/engineering subjects; 'medium' if generalized; 'uncertain' if ambiguous, poorly formatted, or unfamiliar.
5. "prerequisites": List of preceding topic IDs that should strictly be studied before this topic.

Syllabus Input:
${rawText}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a senior academic curriculum architect and technical syllabus parsing engine. Return strictly valid JSON adhering to the schema. Never invent unmentioned units without labeling them clearly.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'Ordered list of syllabus topics with prerequisite mappings',
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              unitOrModule: { type: Type.STRING },
              description: { type: Type.STRING },
              confidence: {
                type: Type.STRING,
                description: 'Must be high, medium, or uncertain'
              },
              prerequisites: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['id', 'title', 'unitOrModule', 'description', 'confidence', 'prerequisites']
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned an empty response. Check network connectivity or syllabus format.');
    }

    let parsed: any[];
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      throw new Error('Failed to parse structured JSON response from Vertex AI topic extraction.');
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('No discrete technical topics could be extracted from the supplied text.');
    }

    return parsed.map((item: any, idx: number) => ({
      id: item.id || `topic_${Date.now()}_${idx + 1}`,
      title: String(item.title || `Topic ${idx + 1}`).trim(),
      unitOrModule: String(item.unitOrModule || 'General Module').trim(),
      description: String(item.description || '').trim(),
      confidence: ['high', 'medium', 'uncertain'].includes(item.confidence)
        ? (item.confidence as 'high' | 'medium' | 'uncertain')
        : 'medium',
      prerequisites: Array.isArray(item.prerequisites) ? item.prerequisites : [],
      order: idx + 1
    }));
  },

  /**
   * Verifies an educational resource claim against official documentation
   */
  async verifyResourceAgainstOfficialDocs(
    resourceTitle: string,
    resourceUrl: string,
    topicContext: string,
    officialDocUrl: string
  ): Promise<VerificationReport> {
    try {
      const ai = this.getAiClient();
      const prompt = `Perform an objective technical verification of learning material claims against the cited official documentation.
Resource Title: "${resourceTitle}"
Resource URL: "${resourceUrl}"
Topic: "${topicContext}"
Official Reference Authority: "${officialDocUrl}"

Task:
1. Extract the core technical claims made by this topic material.
2. Cross-reference them strictly against modern official documentation standards.
3. Check for deprecated patterns (e.g., Buffer() constructor, sync file ops in hot paths, improper cluster socket handles).
4. Assign status:
   - "verified_against_cited_references": if claims are verified and match specifications.
   - "potential_mismatch": if claims teach deprecated APIs, misleading mental models, or security flaws.
   - "unable_to_verify": if claims cannot be validated against the authority reference.
   - "verification_failed": if technical discrepancies make the material unsafe.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a strict technical auditor and standards compliance officer for software engineering curriculums. Cite specific standards and official docs.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: {
                type: Type.STRING,
                description:
                  'Must be verified_against_cited_references, potential_mismatch, unable_to_verify, or verification_failed'
              },
              assessedContentSummary: { type: Type.STRING },
              findings: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              claims: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    claim: { type: Type.STRING },
                    officialDocReference: { type: Type.STRING },
                    officialDocUrl: { type: Type.STRING },
                    matchStatus: {
                      type: Type.STRING,
                      description: 'aligned, deviates, or inconclusive'
                    },
                    explanation: { type: Type.STRING }
                  },
                  required: ['claim', 'officialDocReference', 'officialDocUrl', 'matchStatus', 'explanation']
                }
              },
              limitations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['status', 'assessedContentSummary', 'findings', 'claims', 'limitations']
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty verification response.');
      }
      const data = JSON.parse(text);

      const validStatuses = [
        'verified_against_cited_references',
        'potential_mismatch',
        'unable_to_verify',
        'verification_failed'
      ];
      const status = validStatuses.includes(data.status) ? data.status : 'unable_to_verify';

      return {
        id: `ver_${Date.now()}`,
        resourceId: resourceUrl,
        resourceTitle,
        resourceUrl,
        topicId: topicContext,
        status,
        errorCategory: 'none',
        checkedAt: new Date().toISOString(),
        assessedContentScope: data.assessedContentSummary || 'Evaluated technical claims against official specifications.',
        contentAccessMethod: 'official_spec_ingest',
        officialDocLinks: [
          {
            title: 'Official Node.js Specification',
            url: officialDocUrl || 'https://nodejs.org/docs/latest/api/',
            authority: 'Official Runtime Documentation'
          }
        ],
        findings: Array.isArray(data.findings) ? data.findings : [],
        claims: Array.isArray(data.claims) ? data.claims : [],
        limitations: Array.isArray(data.limitations)
          ? data.limitations
          : ['Verification is bounded by the accessibility of public transcripts and cited references.']
      };
    } catch (err: any) {
      console.error('Verification error:', err);
      return {
        id: `ver_${Date.now()}`,
        resourceId: resourceUrl,
        resourceTitle,
        resourceUrl,
        topicId: topicContext,
        status: 'unable_to_verify',
        errorCategory: 'inaccessible_content',
        checkedAt: new Date().toISOString(),
        assessedContentScope: 'Automated verification query could not establish complete ground-truth verification.',
        contentAccessMethod: 'failed_access',
        officialDocLinks: [
          {
            title: 'Node.js Official Documentation',
            url: officialDocUrl || 'https://nodejs.org/api/',
            authority: 'Official Runtime Docs'
          }
        ],
        findings: ['Direct validation endpoint encountered a timeout or restricted payload.'],
        claims: [],
        limitations: [
          'Live verification requires accessible documentation tokens. Verification status marked as unable_to_verify.'
        ]
      };
    }
  },

  /**
   * Topic-aware AI tutor assistant
   */
  async askLearningAssistant(
    topicTitle: string,
    topicSummary: string,
    studentQuestion: string,
    conversationHistory: { role: 'user' | 'model'; text: string }[] = []
  ): Promise<{ answer: string; citations: { title: string; url: string }[] }> {
    try {
      const ai = this.getAiClient();
      const contextPrompt = `You are a real-time AI Learning Assistant for software engineering students.
Active Topic: "${topicTitle}"
Topic Overview: "${topicSummary}"

Guidelines:
- Answer the student's question clearly with code examples where relevant.
- Emphasize correctness, edge-cases, and standard Node.js/system architecture behavior.
- Clearly state when an answer is based on conventional behavior vs official specs.
- If insufficient evidence is available, honestly state: "Unable to verify this specific behavior in official docs."
- Provide 1 to 2 authoritative official documentation links if available.

Student's question: "${studentQuestion}"
`;

      const contents = [
        ...conversationHistory.map((m) => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        {
          role: 'user',
          parts: [{ text: contextPrompt }]
        }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction:
            'You are an authoritative, pedagogical engineering mentor. Keep answers precise, cite official specifications, and never fabricate citations.'
        }
      });

      const text = response.text || 'I apologize, but I could not formulate an answer at this moment.';

      const citations: { title: string; url: string }[] = [
        {
          title: 'Node.js Official Documentation',
          url: 'https://nodejs.org/api/'
        }
      ];

      return {
        answer: text,
        citations
      };
    } catch (err: any) {
      console.error('AI assistant error:', err);
      return {
        answer: `I encountered a connection issue while communicating with Vertex AI: ${err.message || 'Service temporarily unavailable'}. Please verify your API connectivity and retry.`,
        citations: []
      };
    }
  }
};
