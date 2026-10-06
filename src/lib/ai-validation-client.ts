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

export interface TriageStreamCallbacks {
  onProgress?: (progress: { phase: string; message: string }) => void;
  onToken?: (tokenData: { token: string; accumulatedLength: number }) => void;
  onComplete?: (response: AdminTriageClientResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Streams admin triage evaluation from POST /api/admin/triage-submission via Server-Sent Events (SSE).
 * Includes graceful timeout handling, exponential backoff retries, and real-time token/progress callbacks.
 */
export async function streamAdminTriageSubmission(
  paper: {
    id?: string | undefined;
    paper_title: string;
    author_name?: string | undefined;
    department?: string | undefined;
    track?: string | undefined;
    abstract: string;
    fullText?: string | undefined;
    fileBase64?: string | undefined;
  },
  callbacks: TriageStreamCallbacks = {},
  options: {
    timeoutMs?: number;
    maxRetries?: number;
    baseDelayMs?: number;
  } = {},
): Promise<AdminTriageClientResponse> {
  const timeoutMs = options.timeoutMs ?? 25000;
  const maxRetries = options.maxRetries ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 1000;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.pow(2, attempt - 1) * baseDelayMs;
      callbacks.onProgress?.({
        phase: "retry",
        message: `Temporary delay encountered. Retrying (${attempt}/${maxRetries}) in ${(delay / 1000).toFixed(1)}s...`,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    callbacks.onProgress?.({
      phase: "connecting",
      message: "Establishing real-time stream with Gemini 2.5 Flash...",
    });

    const abortController = new AbortController();
    const timeoutTimer = setTimeout(() => {
      abortController.abort(new Error(`Triage evaluation timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    try {
      const response = await fetch("/api/admin/triage-submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          paperId: paper.id,
          paperTitle: paper.paper_title,
          authorName: paper.author_name,
          department: paper.department,
          track: paper.track,
          abstract: paper.abstract,
          fullText: paper.fullText,
          fileBase64: paper.fileBase64,
          plagiarismMetrics: paper.plagiarismMetrics,
        }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutTimer);

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      // If server returned text/event-stream, read SSE stream
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let finalResponse: AdminTriageClientResponse | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() ?? "";

          for (const block of blocks) {
            const rawEventMatch = block.match(/^event:\s*(\w+)/m);
            const rawDataMatch = block.match(/^data:\s*(.*)$/m);
            if (!rawDataMatch) continue;

            const eventType = rawEventMatch ? rawEventMatch[1] : "message";
            try {
              const data = JSON.parse(rawDataMatch[1]);

              if (eventType === "progress") {
                callbacks.onProgress?.(data);
              } else if (eventType === "token") {
                callbacks.onToken?.(data);
              } else if (eventType === "complete") {
                finalResponse = {
                  success: true,
                  condition: data.condition,
                  recommendedAction: data.recommendedAction,
                  result: data.result,
                };
                callbacks.onComplete?.(finalResponse);
              } else if (eventType === "error") {
                throw new Error(data.message || data.error || "Streaming triage failed");
              }
            } catch {
              // Ignore partial JSON parse errors
            }
          }
        }

        if (finalResponse) {
          return finalResponse;
        }
      } else {
        // Fallback if server returned standard JSON
        const data = (await response.json()) as any;
        if (data.result) {
          const clientResp: AdminTriageClientResponse = {
            success: true,
            condition: data.condition,
            recommendedAction: data.recommendedAction,
            result: data.result,
          };
          callbacks.onComplete?.(clientResp);
          return clientResp;
        }
      }
    } catch (err: unknown) {
      clearTimeout(timeoutTimer);
      lastError = err;
      const isAbort = err instanceof Error && err.name === "AbortError";
      console.warn(`Admin triage attempt ${attempt + 1} failed:`, err);

      if (isAbort) {
        callbacks.onProgress?.({
          phase: "timeout",
          message: "Request timed out, falling back to instant heuristic analysis...",
        });
        break; // Don't retry indefinitely on explicit timeouts
      }
    }
  }

  // Graceful Fallback: Local heuristic assessment
  callbacks.onProgress?.({
    phase: "heuristic",
    message: "Generating heuristic peer evaluation dossier...",
  });

  try {
    const localResult = await adminReviewTriageService.triageSubmission({
      paperId: paper.id,
      paperTitle: paper.paper_title,
      authorName: paper.author_name,
      department: paper.department,
      track: paper.track,
      abstract: paper.abstract,
      fullText: paper.fullText,
      plagiarismMetrics: paper.plagiarismMetrics ? {
        similarityScore: paper.plagiarismMetrics.similarityScore,
        originalityScore: paper.plagiarismMetrics.originalityScore,
        matchCount: paper.plagiarismMetrics.matchCount ?? paper.plagiarismMetrics.flaggedUrls.length,
        flaggedUrls: paper.plagiarismMetrics.flaggedUrls,
      } : undefined,
    });

    const fallbackResponse: AdminTriageClientResponse = {
      success: true,
      condition: localResult.condition,
      recommendedAction: localResult.recommendedAction,
      result: localResult,
    };
    callbacks.onComplete?.(fallbackResponse);
    return fallbackResponse;
  } catch {
    const errorObj = lastError instanceof Error ? lastError : new Error("All triage options exhausted");
    callbacks.onError?.(errorObj);
    throw errorObj;
  }
}

/**
 * Calls POST /api/admin/triage-submission to fetch the AI summary and evaluation.
 * Returns condition (EXCELLENT, ACCEPTABLE, NEEDS_REVISION, POOR), overall score,
 * executive summary, and recommended action.
 */
export async function triageAdminSubmission(
  paper: {
    id?: string | undefined;
    paper_title: string;
    author_name?: string | undefined;
    department?: string | undefined;
    track?: string | undefined;
    abstract: string;
    fullText?: string | undefined;
    plagiarismMetrics?: {
      similarityScore: number;
      originalityScore: number;
      matchCount?: number;
      flaggedUrls: string[];
    } | undefined;
  },
  callbacks?: TriageStreamCallbacks,
): Promise<AdminTriageClientResponse> {
  return await streamAdminTriageSubmission(paper, callbacks || {});
}
