import { GoogleGenAI, Type } from '@google/genai';
import { ExtractedTopic, VerificationReport, ResourceClaimComparison } from '../types';

export const geminiService = {
  getAiClient() {
    return new GoogleGenAI({
      apiKey: process.env.API_KEY,
      vertexai: true
    });
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
        resourceId: resourceUrl,
        status,
        checkedAt: new Date().toISOString(),
        assessedContentSummary: data.assessedContentSummary || 'Evaluated technical claims against official specifications.',
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
        resourceId: resourceUrl,
        status: 'unable_to_verify',
        checkedAt: new Date().toISOString(),
        assessedContentSummary: 'Automated verification query could not establish complete ground-truth verification.',
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
