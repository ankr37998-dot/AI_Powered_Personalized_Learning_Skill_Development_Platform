import {
  ExtractedTopic,
  SubjectUnitGroup,
  SyllabusDraft,
  SyllabusFileMetadata,
} from "../types";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const SUPPORTED_EXTENSIONS = [".txt", ".pdf", ".md", ".text"];
const DRAFT_STORAGE_KEY = "cognipath_syllabus_draft";

export interface FileValidationResult {
  isValid: boolean;
  errorMessage?: string;
  metadata?: SyllabusFileMetadata;
}

export const syllabusService = {
  /**
   * Validates file size and format before ingestion
   */
  validateFile(file: File): FileValidationResult {
    if (!file) {
      return { isValid: false, errorMessage: "No file was provided." };
    }

    if (file.size === 0) {
      return {
        isValid: false,
        errorMessage: "The selected file is empty (0 bytes).",
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        isValid: false,
        errorMessage: `File exceeds maximum size limit of 5MB (selected file: ${sizeMB}MB).`,
      };
    }

    const name = file.name.toLowerCase();
    const hasValidExt = SUPPORTED_EXTENSIONS.some((ext) => name.endsWith(ext));
    const isSupportedMime =
      file.type === "text/plain" ||
      file.type === "text/markdown" ||
      file.type === "application/pdf" ||
      file.type === "";

    if (!hasValidExt && !isSupportedMime) {
      return {
        isValid: false,
        errorMessage:
          "Unsupported format. Please upload a .txt, .pdf, or .md file.",
      };
    }

    return {
      isValid: true,
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type || "text/plain",
        lastModified: file.lastModified,
      },
    };
  },

  /**
   * Reads plain text / markdown file content
   */
  async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("Failed to read file content as text."));
        }
      };
      reader.onerror = () =>
        reject(new Error("File reading encountered an I/O error."));
      reader.readAsText(file);
    });
  },

  extractTopicsFromText(rawText: string): ExtractedTopic[] {
    const topics: ExtractedTopic[] = [];
    let unitOrModule = "General Topics";

    rawText.split(/\r?\n/).forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) return;

      const heading = line.replace(/[:：]$/, "").trim();
      if (
        /^(unit|module|chapter|section|week|part)\b/i.test(heading) ||
        (line.endsWith(":") && line.length < 100)
      ) {
        unitOrModule = heading;
        return;
      }

      const title = line.replace(/^(?:[-*•]\s+|\d+[.)]\s+)/, "").trim();
      if (title.length < 3 || title.length > 200) return;

      topics.push({
        id: `topic_${topics.length + 1}`,
        title,
        unitOrModule,
        description: "Imported from syllabus text. Review and edit before use.",
        confidence: "medium",
        prerequisites: [],
        order: topics.length + 1,
      });
    });

    if (topics.length === 0) {
      throw new Error(
        "No readable topic lines found. Add topics manually or use a plain-text syllabus.",
      );
    }

    return topics;
  },

  /**
   * Groups a flat array of extracted topics by subject/module
   */
  groupTopicsBySubject(topics: ExtractedTopic[]): SubjectUnitGroup[] {
    const map = new Map<string, ExtractedTopic[]>();

    topics.forEach((t) => {
      const key = t.unitOrModule?.trim() || "General Topics";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(t);
    });

    const groups: SubjectUnitGroup[] = [];
    map.forEach((items, name) => {
      groups.push({
        name,
        isExpanded: true,
        topics: items,
      });
    });

    return groups;
  },

  /**
   * Flattens grouped subjects back into a sequential list of ExtractedTopic
   */
  flattenGroups(groups: SubjectUnitGroup[]): ExtractedTopic[] {
    const flattened: ExtractedTopic[] = [];
    let currentOrder = 1;

    groups.forEach((group) => {
      group.topics.forEach((topic) => {
        flattened.push({
          ...topic,
          unitOrModule: group.name,
          order: currentOrder++,
        });
      });
    });

    return flattened;
  },

  /**
   * Saves a syllabus review draft
   */
  saveDraft(draft: SyllabusDraft): void {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn("Failed to save draft to localStorage:", e);
    }
  },

  /**
   * Retrieves any saved syllabus review draft
   */
  getDraft(): SyllabusDraft | null {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Clears saved draft
   */
  clearDraft(): void {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  },
};
