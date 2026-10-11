import { LearningResource, VerificationReport } from "../types";
import { contentAccessService } from "./contentAccessService";
import { googleAiService } from "./googleAiService";
import { storageService } from "./storageService";

export const verificationService = {
  async runVerification(
    resource: LearningResource,
  ): Promise<VerificationReport> {
    const access = await contentAccessService.acquireResourceContent(resource);
    if (!access.isAccessible || !access.extractedTextOrTranscript) {
      const report: VerificationReport = {
        id: `ver_${Date.now()}`,
        resourceId: resource.id,
        resourceTitle: resource.title,
        resourceUrl: resource.url,
        topicId: resource.topicId,
        status: "unable_to_verify",
        errorCategory: access.failureReason?.includes("SSRF")
          ? "ssrf_blocked"
          : "inaccessible_content",
        checkedAt: new Date().toISOString(),
        assessedContentScope: access.contentScopeSummary,
        contentAccessMethod: access.contentAccessMethod,
        officialDocLinks: [],
        findings: [
          access.failureReason || "Resource content could not be accessed.",
        ],
        claims: [],
        limitations: [
          "This resource has not been verified because its content was unavailable.",
        ],
        modelIdentifier: "Gemini 3.8 Flash",
      };
      storageService.saveVerificationReport(report);
      return report;
    }

    try {
      const report = await googleAiService.verifyResource(
        resource,
        access.extractedTextOrTranscript,
      );
      report.assessedContentScope = access.contentScopeSummary;
      report.contentAccessMethod = access.contentAccessMethod;
      storageService.saveVerificationReport(report);
      return report;
    } catch (error) {
      const report: VerificationReport = {
        id: `ver_${Date.now()}`,
        resourceId: resource.id,
        resourceTitle: resource.title,
        resourceUrl: resource.url,
        topicId: resource.topicId,
        status: "verification_failed",
        errorCategory: "model_quota_timeout",
        checkedAt: new Date().toISOString(),
        assessedContentScope: access.contentScopeSummary,
        contentAccessMethod: access.contentAccessMethod,
        officialDocLinks: [],
        findings: [
          error instanceof Error
            ? error.message
            : "Gemini verification request failed.",
        ],
        claims: [],
        limitations: [
          "The resource was not marked verified because the comparison did not complete.",
        ],
        modelIdentifier: "Gemini 3.8 Flash",
      };
      storageService.saveVerificationReport(report);
      return report;
    }
  },
};
