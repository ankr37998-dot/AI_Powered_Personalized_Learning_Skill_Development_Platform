import { ChatMessage, ChatSessionContext, AssistantCitation } from "../types";
import { officialDocsService } from "./officialDocsService";
import { googleAiService } from "./googleAiService";

const MAX_QUESTION_LENGTH = 1000;

export interface StreamCallbacks {
  onChunk: (accumulatedText: string, latestChunk: string) => void;
  onComplete: (fullText: string, citations: AssistantCitation[]) => void;
  onError: (error: Error) => void;
}

export const chatAssistantService = {
  resolveContextCitations(context: ChatSessionContext): AssistantCitation[] {
    const citations: AssistantCitation[] = [];

    if (context.activeTopic) {
      const canonicals = officialDocsService.getReferencesForTopic(
        context.activeTopic.id,
        context.activeSubtopic,
      );

      canonicals.forEach((doc) => {
        citations.push({
          id: doc.id,
          title: doc.title,
          url: doc.canonicalUrl,
          authorityName: doc.authorityName,
          provenance: "canonical_spec",
        });
      });

      context.activeTopic.officialDocSources.forEach((source, index) => {
        if (!citations.some((citation) => citation.url === source.url)) {
          citations.push({
            id: `top_doc_${index}`,
            title: source.title,
            url: source.url,
            authorityName: source.authorityName,
            provenance: "canonical_spec",
          });
        }
      });
    }

    context.activeResource?.verificationReport?.officialDocLinks.forEach(
      (link, index) => {
        if (!citations.some((citation) => citation.url === link.url)) {
          citations.push({
            id: `ver_doc_${index}`,
            title: link.title,
            url: link.url,
            authorityName: link.authority,
            provenance: "verified_resource_report",
          });
        }
      },
    );

    return citations;
  },

  async streamQuery(
    question: string,
    history: ChatMessage[],
    context: ChatSessionContext,
    callbacks: StreamCallbacks,
    signal?: AbortSignal,
  ): Promise<void> {
    if (!question || question.trim().length === 0) {
      throw new Error("Question cannot be empty.");
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      throw new Error(
        `Question exceeds maximum length limit of ${MAX_QUESTION_LENGTH} characters.`,
      );
    }

    if (signal?.aborted) {
      throw new Error("Request was aborted prior to execution.");
    }

    const citations = this.resolveContextCitations(context);
    const references = citations
      .map((citation) => `${citation.title}: ${citation.url}`)
      .join("\n");
    const messages = [
      {
        role: "system" as const,
        content: `You are a careful learning assistant. Answer in context of the learner's current goal (${context.learningGoal || "not provided"}), topic (${context.activeTopic?.title || "not selected"}), and resource (${context.activeResource?.title || "not selected"}). Be accurate, explain code clearly, and do not claim verification you did not perform. Use these references when relevant:\n${references || "No references available."}`,
      },
      ...history.slice(-10).map((message) => ({
        role: (message.sender === "student" ? "user" : "assistant") as const,
        content: message.text,
      })),
      { role: "user" as const, content: question.trim() },
    ];

    try {
      const answer = await googleAiService.streamChat(
        messages,
        (accumulated, latest) => callbacks.onChunk(accumulated, latest),
        signal,
      );
      callbacks.onComplete(answer, citations);
    } catch (error) {
      callbacks.onError(
        error instanceof Error ? error : new Error("Gemini request failed."),
      );
    }
  },
};
