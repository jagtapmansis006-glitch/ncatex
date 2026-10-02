import type { StudentValidationResult, AdminTriageResult } from "../services/ai-validation/types";
import { studentDocumentValidator } from "../services/ai-validation/student-validator";
import { adminReviewTriageService } from "../services/ai-validation/admin-triage";

export interface StudentValidationClientResponse {
  success: boolean;
  saved: boolean;
  status: "PASSED" | "FAILED" | "WARNINGS";
  canSubmit: boolean;
  result: StudentValidationResult;
  error?: string | undefined;
}

export interface AdminTriageClientResponse {
  success: boolean;
  condition: "EXCELLENT" | "ACCEPTABLE" | "NEEDS_REVISION" | "POOR";
  recommendedAction: "APPROVE" | "REJECT" | "REQUEST_CHANGES";
  result: AdminTriageResult;
  error?: string | undefined;
}

/**
 * Sends a PDF/DOCX file to POST /api/student/validate-document
 * Returns structured validation result with format check verdict and actionable feedback.
 * If HTTP 422 (format checks failed), saved is strictly false and canSubmit is false.
 */
export async function validateStudentDocument(
  file: File,
): Promise<StudentValidationClientResponse> {
  try {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const response = await fetch("/api/student/validate-document", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as {
      success: boolean;
      saved: boolean;
      status: "PASSED" | "FAILED" | "WARNINGS";
      result: StudentValidationResult;
      error?: string;
      message?: string;
    };

    if (response.status === 422 || data.saved === false || data.status === "FAILED") {
      return {
        success: false,
        saved: false,
        status: "FAILED",
        canSubmit: false,
        result: data.result,
        error: data.message ?? data.error ?? "Document formatting checks failed.",
      };
    }

    return {
      success: true,
      saved: data.saved ?? false,
      status: data.status ?? "PASSED",
      canSubmit: data.result?.canSubmit ?? true,
      result: data.result,
    };
  } catch (netErr) {
    console.warn("API request failed, performing client-side validation:", netErr);
    // Fallback: convert file to buffer and evaluate locally
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const localResult = await studentDocumentValidator.analyzeDocument({
      filename: file.name,
      buffer,
      mimeType: file.type,
    });

    const isPassed = localResult.status !== "FAILED";
    return {
      success: isPassed,
      saved: localResult.fileSaved,
      status: localResult.status,
      canSubmit: localResult.canSubmit,
      result: localResult,
    };
  }
}

/**
 * Calls POST /api/admin/triage-submission to fetch the AI summary and evaluation.
 * Returns condition (EXCELLENT, ACCEPTABLE, NEEDS_REVISION, POOR), overall score,
 * executive summary, and recommended action.
 */
export async function triageAdminSubmission(paper: {
  id?: string | undefined;
  paper_title: string;
  author_name?: string | undefined;
  department?: string | undefined;
  track?: string | undefined;
  abstract: string;
  fullText?: string | undefined;
}): Promise<AdminTriageClientResponse> {
  try {
    const response = await fetch("/api/admin/triage-submission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paperId: paper.id,
        paperTitle: paper.paper_title,
        authorName: paper.author_name,
        department: paper.department,
        track: paper.track,
        abstract: paper.abstract,
        fullText: paper.fullText,
      }),
    });

    const data = (await response.json()) as {
      success: boolean;
      condition: "EXCELLENT" | "ACCEPTABLE" | "NEEDS_REVISION" | "POOR";
      recommendedAction: "APPROVE" | "REJECT" | "REQUEST_CHANGES";
      result: AdminTriageResult;
      error?: string;
    };

    if (!response.ok || !data.result) {
      throw new Error(data.error ?? "Failed to fetch triage result");
    }

    return {
      success: true,
      condition: data.condition,
      recommendedAction: data.recommendedAction,
      result: data.result,
    };
  } catch (netErr) {
    console.warn("Admin triage API call failed, falling back to local analysis:", netErr);
    const localResult = await adminReviewTriageService.triageSubmission({
      paperId: paper.id,
      paperTitle: paper.paper_title,
      authorName: paper.author_name,
      department: paper.department,
      track: paper.track,
      abstract: paper.abstract,
      fullText: paper.fullText,
    });

    return {
      success: true,
      condition: localResult.condition,
      recommendedAction: localResult.recommendedAction,
      result: localResult,
    };
  }
}
