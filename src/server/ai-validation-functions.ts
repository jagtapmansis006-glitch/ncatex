import { createServerFn } from "@tanstack/react-start";
import { studentDocumentValidator } from "../services/ai-validation/student-validator";
import { adminReviewTriageService } from "../services/ai-validation/admin-triage";
import { runPlagiarismScan, type PlagiarismCheckResult } from "../services/ai-validation/plagiarism-scanner";
import type { StudentValidationResult, AdminTriageResult } from "../services/ai-validation/types";
import { supabase, type PaperRecord } from "../lib/supabase";

export interface StudentDocumentAnalysisPayload {
  filename: string;
  base64: string;
  mimeType?: string | undefined;
  apiKey?: string | undefined;
  saveToStorage?: boolean | undefined;
}

export interface PaperSubmissionPayload {
  authorName: string;
  authorEmail: string;
  department?: string | undefined;
  track?: string | undefined;
  paperTitle: string;
  abstract: string;
  filename: string;
  base64?: string | undefined;
  buffer?: Buffer | Uint8Array | undefined;
  mimeType?: string | undefined;
  apiKey?: string | undefined;
  preValidatedResult?: StudentValidationResult | undefined;
}

export interface AdminTriagePayload {
  paperId?: string | undefined;
  paperTitle: string;
  authorName: string;
  department?: string | undefined;
  track?: string | undefined;
  abstract: string;
  fullText?: string | undefined;
  fileBase64?: string | undefined;
  documentFilename?: string | undefined;
  documentMimeType?: string | undefined;
  apiKey?: string | undefined;
}

export interface PaperSubmissionResult {
  success: boolean;
  saved: boolean;
  paper: PaperRecord;
  pdfUrl: string;
  storagePath: string;
  validationResult: StudentValidationResult;
  plagiarismResult?: PlagiarismCheckResult;
}

/**
 * Underlying handler for Student Document Analysis
 */
export async function analyzeStudentDocumentHandler(
  data: StudentDocumentAnalysisPayload,
): Promise<StudentValidationResult> {
  const buffer = Buffer.from(data.base64, "base64");
  const result = await studentDocumentValidator.analyzeDocument({
    filename: data.filename,
    buffer,
    mimeType: data.mimeType,
    apiKey: data.apiKey,
  });

  // If saveToStorage is requested and format validation passed, save to 'paper-drafts'
  if (data.saveToStorage && result.status !== "FAILED" && result.canSubmit) {
    try {
      const sanitizedFilename = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `drafts/${Date.now()}_${sanitizedFilename}`;
      const { error: storageError } = await supabase.storage
        .from("paper-drafts")
        .upload(storagePath, buffer, {
          contentType: data.mimeType || "application/pdf",
          upsert: true,
        });

      if (storageError) {
        console.error("Storage upload error during validation save:", storageError);
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("paper-drafts")
        .getPublicUrl(storagePath);

      if (urlData?.publicUrl) {
        result.fileSaved = true;
        result.pdfUrl = urlData.publicUrl;
        result.storagePath = storagePath;
      }
    } catch (storageErr) {
      console.error("Failed to save validated document to Supabase Storage:", storageErr);
      throw storageErr;
    }
  }

  return result;
}

/**
 * Underlying handler for Student Paper Submission Pipeline.
 * 1. Runs AI review layer (validation checks).
 * 2. Uploads the incoming PDF directly to Supabase Storage bucket 'paper-drafts'.
 * 3. Obtains public URL for the uploaded PDF.
 * 4. Inserts row into 'papers' table with pdf_url, AI review output, and abstract details.
 * 5. Handles errors with clear logging and exceptions.
 */
export async function submitPaperHandler(
  data: PaperSubmissionPayload,
): Promise<PaperSubmissionResult> {
  const fileBuffer = data.buffer
    ? Buffer.isBuffer(data.buffer)
      ? data.buffer
      : Buffer.from(data.buffer)
    : data.base64
      ? Buffer.from(data.base64, "base64")
      : null;

  if (!fileBuffer || fileBuffer.length === 0) {
    const errorMsg = "Submission rejected: Manuscript file buffer is empty or missing.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const filename = data.filename || "manuscript.pdf";
  const mimeType = data.mimeType || "application/pdf";

  // Step 1: AI Review Layer
  let validationResult = data.preValidatedResult;
  if (!validationResult) {
    try {
      validationResult = await studentDocumentValidator.analyzeDocument({
        filename,
        buffer: fileBuffer,
        mimeType,
        apiKey: data.apiKey,
      });
    } catch (aiError) {
      const errorMsg = `AI review execution failed: ${aiError instanceof Error ? aiError.message : String(aiError)}`;
      console.error(errorMsg, aiError);
      throw new Error(errorMsg);
    }
  }

  if (validationResult.status === "FAILED" || !validationResult.canSubmit) {
    const errorMsg = `AI review validation failed: ${validationResult.summaryMessage || "Document formatting checks failed."}`;
    console.error(errorMsg, validationResult);
    throw new Error(errorMsg);
  }

  // Step 2: Upload incoming PDF directly to Supabase Storage bucket 'paper-drafts'
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `drafts/${Date.now()}_${sanitizedFilename}`;

  const { error: storageError } = await supabase.storage
    .from("paper-drafts")
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (storageError) {
    const errorMsg = `Storage upload failed: ${storageError.message}`;
    console.error(errorMsg, storageError);
    throw new Error(errorMsg);
  }

  // Step 3: Obtain public URL for the uploaded PDF file
  const { data: urlData } = supabase.storage
    .from("paper-drafts")
    .getPublicUrl(storagePath);

  const pdfUrl = urlData?.publicUrl;
  if (!pdfUrl) {
    const errorMsg = `Storage error: Failed to obtain public URL for uploaded PDF in 'paper-drafts' at ${storagePath}.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Step 3.5: Run automated plagiarism check alongside Gemini evaluation
  const snippet = validationResult.fileMetadata?.extractedSnippet || "";
  const plagiarismResult = await runPlagiarismScan({
    text: `${data.paperTitle}\n${data.abstract}\n${snippet}`,
    title: data.paperTitle,
    author: data.authorName,
  });

  // Step 4: Update Supabase database insert call on 'papers' table
  // Include pdf_url (and file_url), plagiarism_score, flagged_urls along with AI review output and abstract details
  const aiSummaryBlock = `\n\n--- AI Review Audit ---\nScore: ${validationResult.overallScore}/100 | Status: ${validationResult.status}\n${validationResult.summaryMessage}`;
  const plagiarismBlock = `\n\n--- Originality & Academic Integrity Report ---\nSimilarity: ${plagiarismResult.similarityScore}% | Originality: ${plagiarismResult.originalityScore}% (${plagiarismResult.status})\n${plagiarismResult.summary}${plagiarismResult.flaggedUrls.length > 0 ? `\nFlagged Sources:\n` + plagiarismResult.flaggedUrls.map((u) => `* ${u}`).join("\n") : ""}`;
  const combinedAbstract = `${data.abstract.trim()}${aiSummaryBlock}${plagiarismBlock}`;

  const insertPayload: Record<string, any> = {
    author_name: data.authorName.trim(),
    author_email: data.authorEmail.trim().toLowerCase(),
    department: (data.department || "Engineering").trim(),
    track: data.track || "Artificial Intelligence & Machine Learning",
    paper_title: data.paperTitle.trim(),
    abstract: combinedAbstract,
    status: "Under Review",
    pdf_url: pdfUrl,
    file_url: pdfUrl,
    plagiarism_score: plagiarismResult.similarityScore,
    originality_score: plagiarismResult.originalityScore,
    flagged_urls: plagiarismResult.flaggedUrls,
  };

  let { data: insertedPaper, error: dbError } = await supabase
    .from("papers")
    .insert([insertPayload])
    .select()
    .single();

  // If column 'pdf_url' or plagiarism columns are not found in schema cache, retry iteratively
  const optionalColumns = ["pdf_url", "plagiarism_score", "originality_score", "flagged_urls"];
  while (dbError && optionalColumns.some((col) => dbError?.message?.includes(col))) {
    for (const col of optionalColumns) {
      if (dbError.message?.includes(col)) {
        console.warn(`Retrying database insert without missing schema cache column '${col}':`, dbError.message);
        delete insertPayload[col];
      }
    }

    const retry = await supabase
      .from("papers")
      .insert([insertPayload])
      .select()
      .single();
    insertedPaper = retry.data;
    dbError = retry.error;
  }

  if (dbError || !insertedPaper) {
    const errorMsg = `Database insert failed: ${dbError ? dbError.message : "Failed to record paper in database."}`;
    console.error(errorMsg, dbError);
    throw new Error(errorMsg);
  }

  const paperRecord: PaperRecord = {
    ...(insertedPaper as PaperRecord),
    pdf_url: (insertedPaper as any).pdf_url || (insertedPaper as any).file_url || pdfUrl,
    file_url: (insertedPaper as any).file_url || pdfUrl,
    plagiarism_score: (insertedPaper as any).plagiarism_score ?? plagiarismResult.similarityScore,
    originality_score: (insertedPaper as any).originality_score ?? plagiarismResult.originalityScore,
    flagged_urls: (insertedPaper as any).flagged_urls ?? plagiarismResult.flaggedUrls,
  };

  validationResult.fileSaved = true;
  validationResult.pdfUrl = pdfUrl;
  validationResult.storagePath = storagePath;

  return {
    success: true,
    saved: true,
    paper: paperRecord,
    pdfUrl,
    storagePath,
    validationResult,
    plagiarismResult,
  };
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
 */
export const analyzeStudentDocumentServerFn = createServerFn({ method: "POST" })
  .validator((data: StudentDocumentAnalysisPayload) => data)
  .handler(async ({ data }): Promise<StudentValidationResult> => {
    return await analyzeStudentDocumentHandler(data);
  });

/**
 * TanStack Start Server Function for Student Paper Submission Pipeline
 */
export const submitPaperServerFn = createServerFn({ method: "POST" })
  .validator((data: PaperSubmissionPayload) => data)
  .handler(async ({ data }): Promise<PaperSubmissionResult> => {
    return await submitPaperHandler(data);
  });

/**
 * TanStack Start Server Function for Admin Review & Triage
 */
export const triageAdminSubmissionServerFn = createServerFn({ method: "POST" })
  .validator((data: AdminTriagePayload) => data)
  .handler(async ({ data }): Promise<AdminTriageResult> => {
    return await triageAdminSubmissionHandler(data);
  });
