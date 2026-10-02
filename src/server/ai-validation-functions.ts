import { createServerFn } from "@tanstack/react-start";
import { studentDocumentValidator } from "../services/ai-validation/student-validator";
import { adminReviewTriageService } from "../services/ai-validation/admin-triage";
import type { StudentValidationResult, AdminTriageResult } from "../services/ai-validation/types";

export interface StudentDocumentAnalysisPayload {
  filename: string;
  base64: string;
  mimeType?: string | undefined;
  apiKey?: string | undefined;
}

export interface AdminTriagePayload {
  paperId?: string | undefined;
  paperTitle: string;
  authorName?: string | undefined;
  department?: string | undefined;
  track?: string | undefined;
  abstract: string;
  fullText?: string | undefined;
  fileBase64?: string | undefined;
  documentFilename?: string | undefined;
  documentMimeType?: string | undefined;
  apiKey?: string | undefined;
}

/**
 * Underlying handler for Student Document Analysis
 */
export async function analyzeStudentDocumentHandler(
  data: StudentDocumentAnalysisPayload,
): Promise<StudentValidationResult> {
  const buffer = Buffer.from(data.base64, "base64");
  return await studentDocumentValidator.analyzeDocument({
    filename: data.filename,
    buffer,
    mimeType: data.mimeType,
    apiKey: data.apiKey,
  });
}

/**
 * Underlying handler for Admin Review & Triage
 */
export async function triageAdminSubmissionHandler(
  data: AdminTriagePayload,
): Promise<AdminTriageResult> {
  const documentBuffer = data.fileBase64 ? Buffer.from(data.fileBase64, "base64") : undefined;
  return await adminReviewTriageService.triageSubmission({
    paperId: data.paperId,
    paperTitle: data.paperTitle,
    authorName: data.authorName,
    department: data.department,
    track: data.track,
    abstract: data.abstract,
    fullText: data.fullText,
    documentBuffer,
    documentFilename: data.documentFilename,
    documentMimeType: data.documentMimeType,
    apiKey: data.apiKey,
  });
}

/**
 * TanStack Start Server Function for Student Document Analysis
 * Accepts base64 encoded file data (PDF/DOCX) or text snippet.
 * Checks formatting, fonts, page layouts, and mandatory sections via gemini-3.8-flash.
 * Returns actionable feedback without saving files if format checks fail.
 */
export const analyzeStudentDocumentServerFn = createServerFn({ method: "POST" })
  .validator((data: StudentDocumentAnalysisPayload) => data)
  .handler(async ({ data }): Promise<StudentValidationResult> => {
    return await analyzeStudentDocumentHandler(data);
  });

/**
 * TanStack Start Server Function for Admin Review & Triage
 * Evaluates approved submissions for content quality, technical depth, and condition.
 * Generates an executive summary and recommended action (APPROVE, REJECT, REQUEST_CHANGES).
 */
export const triageAdminSubmissionServerFn = createServerFn({ method: "POST" })
  .validator((data: AdminTriagePayload) => data)
  .handler(async ({ data }): Promise<AdminTriageResult> => {
    return await triageAdminSubmissionHandler(data);
  });
