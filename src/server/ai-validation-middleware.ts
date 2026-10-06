import { analyzeStudentDocumentHandler, submitPaperHandler } from "./ai-validation-functions";
import { adminReviewTriageService } from "../services/ai-validation/admin-triage";
import type { AdminTriageInput } from "../services/ai-validation/types";
import { GEMINI_MODEL, resolveGeminiApiKey } from "../services/ai-validation/gemini-client";
import { supabase } from "../lib/supabase";

/**
 * Standard HTTP response helper
 */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Gemini-Key",
    },
  });
}

/**
 * Standalone middleware and router for AI validation endpoints.
 * Intercepts requests for Student Document Analysis and Admin Review & Triage.
 *
 * Available routes:
 * 1. POST /api/student/validate-document (or /api/student/analyze)
 *    - Accepts PDF/DOCX (multipart/form-data or JSON base64)
 *    - Properly extracts file buffer before running student document analysis via Gemini
 *    - Checks formatting, fonts, page layouts, and mandatory sections via gemini-3.8-flash
 *    - Returns actionable feedback without saving files if format checks fail (HTTP 422)
 *    - Catches all exceptions cleanly with JSON error responses (HTTP 500/422)
 *
 * 2. POST /api/admin/triage-submission (or /api/admin/triage)
 *    - Evaluates approved submissions for content quality, technical depth, and condition
 *    - Generates executive summary and recommended action (APPROVE, REJECT, REQUEST_CHANGES)
 *
 * 3. GET /api/ai/health
 *    - Healthcheck reporting configured Gemini model and operational status
 */
export async function handleAiValidationRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "");

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Gemini-Key",
      },
    });
  }

  // Route: Health check
  if (pathname === "/api/ai/health" && request.method === "GET") {
    const hasKey = Boolean(resolveGeminiApiKey(request.headers.get("X-Gemini-Key") ?? undefined));
    return jsonResponse({
      status: "online",
      model: GEMINI_MODEL,
      apiKeyConfigured: hasKey,
      endpoints: [
        {
          path: "/api/student/validate-document",
          method: "POST",
          description: "Student document analysis (PDF & DOCX format and section validation)",
        },
        {
          path: "/api/admin/triage-submission",
          method: "POST",
          description: "Admin submission triage (content quality, technical depth, condition & action)",
        },
      ],
      timestamp: new Date().toISOString(),
    });
  }

  // Route 1: Student Document Analysis Endpoint
  if (
    (pathname === "/api/student/validate-document" ||
      pathname === "/api/student/analyze" ||
      pathname === "/api/ai/validate-student-document") &&
    request.method === "POST"
  ) {
    return await handleStudentDocumentAnalysisEndpoint(request);
  }

  // Route 2: Student Paper Submission Pipeline Endpoint
  if (
    (pathname === "/api/student/submit-paper" ||
      pathname === "/api/student/submit" ||
      pathname === "/api/papers/submit" ||
      pathname === "/api/paper/submit" ||
      pathname === "/api/papers/upload") &&
    request.method === "POST"
  ) {
    return await handlePaperSubmissionEndpoint(request);
  }

  // Route 3: Admin Review & Triage Endpoint
  if (
    (pathname === "/api/admin/triage-submission" ||
      pathname === "/api/admin/triage" ||
      pathname === "/api/admin/triage-stream" ||
      pathname === "/api/admin/triage/stream" ||
      pathname === "/api/ai/triage-admin-submission") &&
    request.method === "POST"
  ) {
    return await handleAdminTriageEndpoint(request);
  }

  // Not an AI validation route
  return null;
}

/**
 * Handler for Endpoint 1: Student Document Analysis
 * Properly extracts file buffer from multipart/form-data before executing validation.
 * Catches all exceptions during processing and returns clean JSON responses.
 */
async function handleStudentDocumentAnalysisEndpoint(request: Request): Promise<Response> {
  try {
    const customKey = request.headers.get("X-Gemini-Key") ?? undefined;
    const contentType = request.headers.get("content-type") ?? "";

    let filename = "manuscript.pdf";
    let base64 = "";
    let mimeType: string | undefined;
    let saveToStorage = false;

    // Check if paperTitle or title is present to route to submission pipeline
    let paperTitle = "";
    let authorName = "";
    let authorEmail = "";
    let department = "";
    let track = "";
    let abstract = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") ?? formData.get("document") ?? formData.get("manuscript");

      if (!file || !(file instanceof Blob)) {
        return jsonResponse(
          {
            success: false,
            saved: false,
            status: "FAILED",
            error: "Bad Request",
            message: "No document file was found in 'file' field of multipart/form-data.",
          },
          400,
        );
      }

      filename = (file as File).name || "manuscript.pdf";
      mimeType = file.type || undefined;

      // Extract arrayBuffer and convert to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length === 0) {
        return jsonResponse(
          {
            success: false,
            saved: false,
            status: "FAILED",
            error: "Bad Request",
            message: "Uploaded file is empty (0 bytes).",
          },
          400,
        );
      }

      base64 = buffer.toString("base64");
      saveToStorage =
        formData.get("save") === "true" ||
        formData.get("saveToStorage") === "true" ||
        formData.get("submit") === "true";

      paperTitle = (formData.get("paperTitle") || formData.get("title") || "") as string;
      authorName = (formData.get("authorName") || formData.get("author") || "") as string;
      authorEmail = (formData.get("authorEmail") || formData.get("email") || "") as string;
      department = (formData.get("department") || "") as string;
      track = (formData.get("track") || "") as string;
      abstract = (formData.get("abstract") || "") as string;
    } else if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        filename?: string;
        base64?: string;
        mimeType?: string;
        text?: string;
        save?: boolean;
        saveToStorage?: boolean;
        submit?: boolean;
        paperTitle?: string;
        title?: string;
        authorName?: string;
        author?: string;
        authorEmail?: string;
        email?: string;
        department?: string;
        track?: string;
        abstract?: string;
      };

      if (!body.base64 && !body.text) {
        return jsonResponse(
          {
            success: false,
            saved: false,
            status: "FAILED",
            error: "Bad Request",
            message: "JSON body must provide 'base64' (data of PDF or DOCX file) or 'text'.",
          },
          400,
        );
      }

      filename = body.filename || "manuscript.pdf";
      mimeType = body.mimeType;

      if (body.base64) {
        base64 = body.base64;
      } else {
        base64 = Buffer.from(body.text ?? "", "utf-8").toString("base64");
      }

      saveToStorage = Boolean(body.save || body.saveToStorage || body.submit);
      paperTitle = body.paperTitle || body.title || "";
      authorName = body.authorName || body.author || "";
      authorEmail = body.authorEmail || body.email || "";
      department = body.department || "";
      track = body.track || "";
      abstract = body.abstract || "";
    } else {
      return jsonResponse(
        {
          success: false,
          saved: false,
          status: "FAILED",
          error: "Unsupported Media Type",
          message: "Content-Type must be 'multipart/form-data' or 'application/json'.",
        },
        415,
      );
    }

    // If request contains submission metadata (title or submit flag), execute full submission pipeline
    if (paperTitle || saveToStorage) {
      const buffer = Buffer.from(base64, "base64");
      const submissionResult = await submitPaperHandler({
        authorName: authorName || "Student Author",
        authorEmail: authorEmail || "student@ncatex.edu",
        department,
        track,
        paperTitle: paperTitle || filename.replace(/\.[^/.]+$/, ""),
        abstract: abstract || "Submitted manuscript.",
        filename,
        buffer,
        mimeType,
        apiKey: customKey,
      });

      return jsonResponse(
        {
          success: true,
          saved: true,
          status: submissionResult.validationResult.status,
          pdfUrl: submissionResult.pdfUrl,
          storagePath: submissionResult.storagePath,
          paper: submissionResult.paper,
          result: submissionResult.validationResult,
        },
        200,
      );
    }

    // Standard pre-validation without saving to database
    const validationResult = await analyzeStudentDocumentHandler({
      filename,
      base64,
      mimeType,
      apiKey: customKey,
      saveToStorage,
    });

    const isPassed = validationResult.status !== "FAILED";

    return jsonResponse(
      {
        success: isPassed,
        saved: validationResult.fileSaved, // Strictly false if format checks failed
        status: validationResult.status,
        pdfUrl: validationResult.pdfUrl,
        storagePath: validationResult.storagePath,
        result: validationResult,
      },
      isPassed ? 200 : 422,
    );
  } catch (error: unknown) {
    console.error("Error in student document validation endpoint:", error);

    const errorMessage = error instanceof Error ? error.message : "Document validation process failed.";
    const isFormatOrInputError =
      errorMessage.toLowerCase().includes("unsupported") ||
      errorMessage.toLowerCase().includes("invalid") ||
      errorMessage.toLowerCase().includes("malformed") ||
      errorMessage.toLowerCase().includes("ai review");

    return jsonResponse(
      {
        success: false,
        saved: false,
        status: "FAILED",
        error: isFormatOrInputError ? "Validation Error" : "Internal Server Error",
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      isFormatOrInputError ? 422 : 500,
    );
  }
}

/**
 * Handler for Endpoint: Student Paper Submission Pipeline
 * Uploads incoming PDF directly to Supabase Storage bucket 'paper-drafts',
 * obtains public URL, inserts paper into 'papers' table with pdf_url, AI review output,
 * and abstract details, with comprehensive error handling.
 */
async function handlePaperSubmissionEndpoint(request: Request): Promise<Response> {
  try {
    const customKey = request.headers.get("X-Gemini-Key") ?? undefined;
    const contentType = request.headers.get("content-type") ?? "";

    let filename = "manuscript.pdf";
    let mimeType: string | undefined;
    let buffer: Buffer | undefined;
    let authorName = "";
    let authorEmail = "";
    let department = "";
    let track = "";
    let paperTitle = "";
    let abstract = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") ?? formData.get("document") ?? formData.get("manuscript");

      if (!file || !(file instanceof Blob)) {
        return jsonResponse(
          {
            success: false,
            saved: false,
            status: "FAILED",
            error: "Bad Request",
            message: "Missing manuscript document file in multipart/form-data field 'file'.",
          },
          400,
        );
      }

      filename = (file as File).name || "manuscript.pdf";
      mimeType = file.type || undefined;
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);

      authorName = (formData.get("authorName") || formData.get("author") || "") as string;
      authorEmail = (formData.get("authorEmail") || formData.get("email") || "") as string;
      department = (formData.get("department") || "") as string;
      track = (formData.get("track") || "") as string;
      paperTitle = (formData.get("paperTitle") || formData.get("title") || "") as string;
      abstract = (formData.get("abstract") || "") as string;
    } else if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        filename?: string;
        base64?: string;
        mimeType?: string;
        authorName?: string;
        author?: string;
        authorEmail?: string;
        email?: string;
        department?: string;
        track?: string;
        paperTitle?: string;
        title?: string;
        abstract?: string;
      };

      if (!body.base64) {
        return jsonResponse(
          {
            success: false,
            saved: false,
            status: "FAILED",
            error: "Bad Request",
            message: "JSON body must provide 'base64' encoded PDF file data.",
          },
          400,
        );
      }

      filename = body.filename || "manuscript.pdf";
      mimeType = body.mimeType;
      buffer = Buffer.from(body.base64, "base64");
      authorName = body.authorName || body.author || "";
      authorEmail = body.authorEmail || body.email || "";
      department = body.department || "";
      track = body.track || "";
      paperTitle = body.paperTitle || body.title || "";
      abstract = body.abstract || "";
    } else {
      return jsonResponse(
        {
          success: false,
          saved: false,
          status: "FAILED",
          error: "Unsupported Media Type",
          message: "Content-Type must be 'multipart/form-data' or 'application/json'.",
        },
        415,
      );
    }

    if (!buffer || buffer.length === 0) {
      return jsonResponse(
        {
          success: false,
          saved: false,
          status: "FAILED",
          error: "Bad Request",
          message: "Uploaded manuscript file is empty (0 bytes).",
        },
        400,
      );
    }

    authorName = authorName.trim() || "Student Author";
    authorEmail = authorEmail.trim().toLowerCase() || "student@ncatex.edu";
    paperTitle = paperTitle.trim() || filename.replace(/\.[^/.]+$/, "");
    abstract = abstract.trim() || "Manuscript submission abstract.";

    const submissionResult = await submitPaperHandler({
      authorName,
      authorEmail,
      department,
      track,
      paperTitle,
      abstract,
      filename,
      buffer,
      mimeType,
      apiKey: customKey,
    });

    return jsonResponse(
      {
        success: true,
        saved: true,
        status: submissionResult.validationResult.status,
        pdfUrl: submissionResult.pdfUrl,
        storagePath: submissionResult.storagePath,
        paper: submissionResult.paper,
        result: submissionResult.validationResult,
      },
      201,
    );
  } catch (error: unknown) {
    console.error("Error in paper submission endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "Manuscript submission pipeline failed.";
    const isAiValidationFail =
      errorMessage.toLowerCase().includes("ai review") ||
      errorMessage.toLowerCase().includes("validation failed") ||
      errorMessage.toLowerCase().includes("formatting checks failed");

    return jsonResponse(
      {
        success: false,
        saved: false,
        status: "FAILED",
        error: isAiValidationFail ? "Validation Error" : "Submission Error",
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      isAiValidationFail ? 422 : 500,
    );
  }
}

/**
 * Handler for Endpoint 2: Admin Review & Triage
 */
async function handleAdminTriageEndpoint(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, "");
    const customKey = request.headers.get("X-Gemini-Key") ?? undefined;
    const contentType = request.headers.get("content-type") ?? "";

    let triageInput: AdminTriageInput;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const paperTitle = (formData.get("paperTitle") || formData.get("title") || "") as string;
      const abstract = (formData.get("abstract") || "") as string;
      const authorName = (formData.get("authorName") || formData.get("author") || "") as string;
      const department = (formData.get("department") || "") as string;
      const track = (formData.get("track") || "") as string;
      const paperId = (formData.get("paperId") || formData.get("id") || "") as string;
      const fullText = (formData.get("fullText") || "") as string;

      const file = formData.get("file");
      let documentBuffer: Buffer | undefined;
      let documentFilename: string | undefined;
      let documentMimeType: string | undefined;

      if (file && file instanceof Blob) {
        const arrayBuffer = await file.arrayBuffer();
        documentBuffer = Buffer.from(arrayBuffer);
        documentFilename = (file as File).name;
        documentMimeType = file.type;
      }

      triageInput = {
        paperId: paperId || undefined,
        paperTitle: paperTitle || "Untitled Submission",
        authorName: authorName || undefined,
        department: department || undefined,
        track: track || undefined,
        abstract: abstract || "No abstract provided.",
        fullText: fullText || undefined,
        documentBuffer,
        documentFilename,
        documentMimeType,
        apiKey: customKey,
      };
    } else if (contentType.includes("application/json")) {
      const body = (await request.json()) as AdminTriageInput & {
        title?: string;
        author?: string;
        fileBase64?: string;
        filename?: string;
        plagiarismMetrics?: {
          similarityScore: number;
          originalityScore: number;
          matchCount?: number;
          flaggedUrls: string[];
        };
      };

      let documentBuffer: Buffer | undefined;
      if (body.fileBase64) {
        documentBuffer = Buffer.from(body.fileBase64, "base64");
      }

      triageInput = {
        paperId: body.paperId,
        paperTitle: body.paperTitle || body.title || "Untitled Submission",
        authorName: body.authorName || body.author,
        department: body.department,
        track: body.track,
        abstract: body.abstract || "No abstract provided.",
        fullText: body.fullText,
        documentBuffer,
        documentFilename: body.documentFilename || body.filename,
        documentMimeType: body.documentMimeType,
        plagiarismMetrics: body.plagiarismMetrics ? {
          similarityScore: body.plagiarismMetrics.similarityScore,
          originalityScore: body.plagiarismMetrics.originalityScore,
          matchCount: body.plagiarismMetrics.matchCount ?? body.plagiarismMetrics.flaggedUrls.length,
          flaggedUrls: body.plagiarismMetrics.flaggedUrls,
        } : undefined,
        apiKey: customKey,
      };
    } else {
      return jsonResponse(
        {
          error: "Unsupported Media Type",
          message: "Content-Type must be 'application/json' or 'multipart/form-data'.",
        },
        415,
      );
    }

    if (!triageInput.paperTitle && !triageInput.abstract) {
      return jsonResponse(
        {
          error: "Bad Request",
          message: "Either 'paperTitle' or 'abstract' is required to triage submission.",
        },
        400,
      );
    }

    // If plagiarism metrics were not explicitly passed in payload, but a paperId is provided,
    // load previously scanned metrics from Supabase database record
    if (!triageInput.plagiarismMetrics && triageInput.paperId) {
      try {
        const { data: dbPaper } = await supabase
          .from("papers")
          .select("plagiarism_score, originality_score, flagged_urls")
          .eq("id", triageInput.paperId)
          .maybeSingle();

        if (dbPaper && dbPaper.plagiarism_score !== null && dbPaper.plagiarism_score !== undefined) {
          const sim = Number(dbPaper.plagiarism_score);
          const orig = Number(dbPaper.originality_score ?? (100 - sim));
          const urls = Array.isArray(dbPaper.flagged_urls) ? dbPaper.flagged_urls : [];
          triageInput.plagiarismMetrics = {
            similarityScore: sim,
            originalityScore: orig,
            matchCount: urls.length,
            flaggedUrls: urls,
          };
        }
      } catch (dbErr) {
        // Continue gracefully with heuristic scan
      }
    }

    // Check if client requested Server-Sent Events (SSE) streaming
    const isStreaming =
      request.headers.get("accept")?.includes("text/event-stream") ||
      url.searchParams.get("stream") === "true" ||
      pathname.includes("stream");

    if (isStreaming) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      const sendEvent = async (event: string, data: unknown) => {
        try {
          await writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Client disconnected
        }
      };

      (async () => {
        try {
          await sendEvent("progress", {
            phase: "init",
            message: "Connected to Gemini 2.5 Flash Triage Engine...",
          });

          await adminReviewTriageService.triageSubmissionStream(triageInput, async (streamEvent) => {
            await sendEvent(streamEvent.type, streamEvent.data);
          });
        } catch (streamErr) {
          console.error("Error during admin triage streaming:", streamErr);
          await sendEvent("error", {
            error: "Streaming Error",
            message: streamErr instanceof Error ? streamErr.message : "Triage stream failed",
          });
        } finally {
          try {
            await writer.close();
          } catch {
            // Ignore if closed
          }
        }
      })();

      return new Response(readable, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Gemini-Key",
        },
      });
    }

    const triageResult = await adminReviewTriageService.triageSubmission(triageInput);

    return jsonResponse({
      success: true,
      condition: triageResult.condition,
      recommendedAction: triageResult.recommendedAction,
      result: triageResult,
    });
  } catch (error) {
    console.error("Error in admin triage endpoint:", error);
    return jsonResponse(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Admin triage process failed.",
      },
      500,
    );
  }
}
