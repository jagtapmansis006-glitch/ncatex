import { extractDocxContent } from "./docx-extractor";
import { extractPdfContent } from "./pdf-extractor";
import {
  getGeminiClient,
  GEMINI_MODEL,
  generateContentWithFallback,
  generateContentStreamWithFallback,
} from "./gemini-client";
import { adminTriageSchema } from "./schemas";
import {
  runPlagiarismScan,
  runLocalAcademicPlagiarismScan,
  type PlagiarismCheckResult,
} from "./plagiarism-scanner";
import type {
  AdminTriageInput,
  AdminTriageResult,
  DocumentCondition,
  AdminAction,
  OriginalityReport,
} from "./types";

export type TriageStreamEvent =
  | { type: "progress"; data: { phase: string; message: string } }
  | { type: "token"; data: { token: string; accumulatedLength: number } }
  | {
      type: "complete";
      data: {
        success: boolean;
        condition: DocumentCondition;
        recommendedAction: AdminAction;
        result: AdminTriageResult;
      };
    }
  | { type: "error"; data: { error: string; message: string } };

interface CachedGenAiFile {
  fileUri: string;
  mimeType: string;
  uploadedAt: number;
}

// In-memory cache for GenAI Files API uploads with 48h TTL (Context Caching for stored manuscripts)
const genAiFilesCache = new Map<string, CachedGenAiFile>();

const TRIAGE_GENERATION_CONFIG = {
  responseMimeType: "application/json",
  responseSchema: adminTriageSchema,
  temperature: 0.2,
  maxOutputTokens: 2048,
  thinkingConfig: {
    thinkingBudget: 0, // Capped to 0 to disable extended reasoning delay and achieve minimal TTFT
  },
};

/**
 * Prepares the payload for Gemini triage, utilizing the Files API (files.upload)
 * instead of embedding large inline base64 strings in every prompt.
 * Also synthesizes plagiarism metrics for the Originality & Integrity Report.
 */
async function prepareOptimizedContents({
  gemini,
  input,
  extractedDocText,
  isPdf,
  onProgress,
}: {
  gemini: NonNullable<ReturnType<typeof getGeminiClient>>;
  input: AdminTriageInput;
  extractedDocText: string;
  isPdf: boolean;
  onProgress?: (message: string) => void | Promise<void>;
}): Promise<{
  contents: Array<
    | string
    | { fileData: { fileUri: string; mimeType: string } }
    | { inlineData: { mimeType: string; data: string } }
  >;
  plagiarismResult: PlagiarismCheckResult;
}> {
  const contents: Array<
    | string
    | { fileData: { fileUri: string; mimeType: string } }
    | { inlineData: { mimeType: string; data: string } }
  > = [];

  // 1. Plagiarism scan evaluation
  if (onProgress) await onProgress("Running plagiarism scan and academic integrity check...");
  let plagiarismResult: PlagiarismCheckResult;
  if (input.plagiarismMetrics) {
    plagiarismResult = {
      similarityScore: input.plagiarismMetrics.similarityScore,
      originalityScore: input.plagiarismMetrics.originalityScore,
      matchCount: input.plagiarismMetrics.matchCount,
      flaggedUrls: input.plagiarismMetrics.flaggedUrls,
      matchedSources: input.plagiarismMetrics.flaggedUrls.map((url) => ({
        url,
        title: "Verified External Literature",
        percentMatched: input.plagiarismMetrics?.similarityScore || 5,
      })),
      status: input.plagiarismMetrics.similarityScore > 25 ? "HIGH" : input.plagiarismMetrics.similarityScore >= 10 ? "MODERATE" : "CLEAN",
      summary: `Similarity: ${input.plagiarismMetrics.similarityScore}% | Originality: ${input.plagiarismMetrics.originalityScore}%`,
      scannedAt: new Date().toISOString(),
      provider: "copyscape",
    };
  } else {
    plagiarismResult = await runPlagiarismScan({
      text: `${input.paperTitle}\n${input.abstract}\n${extractedDocText}`,
      title: input.paperTitle,
      author: input.authorName,
    });
  }

  // 2. Use Google Gen AI Files API with Context Caching if a document buffer is present
  if (input.documentBuffer && input.documentBuffer.length > 0) {
    const mimeType = isPdf ? "application/pdf" : (input.documentMimeType || "application/octet-stream");
    const cacheKey = `${input.paperId || "paper"}_${input.documentBuffer.length}_${isPdf ? "pdf" : "doc"}`;
    const cached = genAiFilesCache.get(cacheKey);

    if (cached && Date.now() - cached.uploadedAt < 48 * 60 * 60 * 1000) {
      if (onProgress) await onProgress("Reusing cached manuscript context from GenAI Files API...");
      contents.push({
        fileData: {
          fileUri: cached.fileUri,
          mimeType: cached.mimeType,
        },
      });
    } else if (typeof gemini.files?.upload === "function") {
      try {
        if (onProgress) await onProgress("Uploading manuscript to Google GenAI Files API...");
        const blob = new Blob([input.documentBuffer], { type: mimeType });
        const uploaded = await gemini.files.upload({
          file: blob,
          config: {
            mimeType,
            displayName: input.documentFilename || (isPdf ? "manuscript.pdf" : "manuscript"),
          },
        });
        if (uploaded?.uri) {
          const fileUri = uploaded.uri;
          const resolvedMime = uploaded.mimeType || mimeType;
          genAiFilesCache.set(cacheKey, {
            fileUri,
            mimeType: resolvedMime,
            uploadedAt: Date.now(),
          });
          contents.push({
            fileData: {
              fileUri,
              mimeType: resolvedMime,
            },
          });
        }
      } catch (uploadErr) {
        console.warn("GenAI Files API upload failed, falling back to text snippet:", uploadErr);
      }
    }
  }

  const prompt = `You are the Technical Program Committee (TPC) Chair and Chief Academic Editor for the 2nd National Conference on Advanced Trends in Engineering (NCATEX).
You are conducting executive triage and rigorous peer review on a submitted manuscript.

[SUBMISSION DETAILS]:
- Paper ID: ${input.paperId ?? "N/A"}
- Title: ${input.paperTitle}
- Author: ${input.authorName ?? "Anonymous"}
- Department: ${input.department ?? "Engineering"}
- Track: ${input.track ?? "General Engineering"}
- Abstract:
${input.abstract}

${extractedDocText ? `\n[MANUSCRIPT BODY / EXTRACTED CONTENT]:\n${extractedDocText.slice(0, 16000)}` : ""}

[PLAGIARISM & INTEGRITY DETECTION RESULTS]:
- Match Count: ${plagiarismResult.matchCount}
- Plagiarism Similarity Score: ${plagiarismResult.similarityScore}%
- Originality Rating: ${plagiarismResult.originalityScore}%
- Integrity Status: ${plagiarismResult.status}
- Flagged Source URLs:
${plagiarismResult.flaggedUrls.length > 0 ? plagiarismResult.flaggedUrls.map((u) => `  * ${u}`).join("\n") : "  None flagged (<5% baseline citations)"}

[TRIAGE INSTRUCTIONS]:
1. Content Quality:
   - Evaluate clarity of the problem formulation, writing caliber, cohesion, and scholarly presentation.
2. Technical Depth:
   - Assess algorithmic sophistication, mathematical modeling, empirical validity, benchmark comparison against state-of-the-art, and reproducibility.
3. Determine Condition:
   - "EXCELLENT": Groundbreaking or deeply rigorous contribution, strong baselines, clear figures, ready for publication.
   - "ACCEPTABLE": Solid scholarly contribution with minor revisions or standard benchmarks.
   - "NEEDS_REVISION": Promising concept but flawed or missing baselines, unclear mathematical formulation, or missing ablation.
   - "POOR": Low technical depth, derivative work, superficial claims without empirical proof, or low scholarly rigor.
4. Executive Summary:
   - Synthesize a sharp, 2-4 sentence executive briefing for the conference track chairs capturing contribution, technical value, and primary decision basis.
5. Recommended Action:
   - Strictly choose one of: "APPROVE", "REJECT", or "REQUEST_CHANGES".
6. Originality & Integrity Report:
   - Synthesize the manuscript evaluation with the plagiarism detection results.
   - Include a dedicated 'Originality & Integrity Report' section highlighting matched sources and similarity score.
   - Populate originalityReport with similarityScore, originalityScore, status, flaggedUrls, and integritySummary.
7. Assign scores (1-10) for contentQuality, technicalDepth, novelty, methodologyRigor, clarityAndOrganization, and composite overallAssessmentScore (0-100).
8. Detail key strengths, weaknesses, flagged concerns, and specific focus areas for reviewers.`;

  contents.push(prompt);
  return { contents, plagiarismResult };
}

export class AdminReviewTriageService {
  /**
   * Helper to extract document text and detect mime types without sending large base64 inline.
   */
  private async extractInputText(input: AdminTriageInput): Promise<{
    extractedDocText: string;
    isDocx: boolean;
    isPdf: boolean;
  }> {
    let extractedDocText = input.fullText ?? "";
    let isDocx = false;
    let isPdf = false;

    if (input.documentBuffer && input.documentBuffer.length > 0) {
      const filename = input.documentFilename || "";
      const ext = filename.split(".").pop()?.toLowerCase();
      isPdf = ext === "pdf" || input.documentMimeType === "application/pdf";
      isDocx =
        ext === "docx" ||
        input.documentMimeType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (isDocx) {
        try {
          const docxResult = await extractDocxContent(input.documentBuffer);
          extractedDocText = `${docxResult.markdown}\n\n${docxResult.rawText}`;
        } catch (e) {
          console.warn("Failed to extract DOCX in triage:", e);
        }
      } else if (isPdf) {
        try {
          const pdfData = extractPdfContent(input.documentBuffer);
          if (pdfData.extractedSnippet) {
            extractedDocText += `\n\n[PDF Snippet]: ${pdfData.extractedSnippet}`;
          }
        } catch (e) {
          console.warn("Failed to extract PDF in triage:", e);
        }
      }
    }

    return { extractedDocText, isDocx, isPdf };
  }

  /**
   * Evaluates approved submissions using Gemini 2.5 Flash with structured JSON output.
   * Uses Files API and thinking budget = 0 for rapid response generation.
   */
  async triageSubmission(input: AdminTriageInput): Promise<AdminTriageResult> {
    const { extractedDocText, isPdf } = await this.extractInputText(input);

    const gemini = getGeminiClient(input.apiKey);

    if (gemini) {
      try {
        const { contents, plagiarismResult } = await prepareOptimizedContents({
          gemini,
          input,
          extractedDocText,
          isPdf,
        });

        const response = await generateContentWithFallback(gemini, {
          model: GEMINI_MODEL,
          contents,
          config: TRIAGE_GENERATION_CONFIG,
        });

        const text = response.text?.trim() ?? "{}";
        const parsed = JSON.parse(text) as Omit<
          AdminTriageResult,
          "paperId" | "paperTitle" | "authorName" | "track" | "evaluatedAt"
        >;

        const originalityReport: OriginalityReport = parsed.originalityReport || {
          similarityScore: plagiarismResult.similarityScore,
          originalityScore: plagiarismResult.originalityScore,
          status: plagiarismResult.status,
          flaggedUrls: plagiarismResult.flaggedUrls,
          integritySummary: plagiarismResult.summary,
        };

        return {
          paperId: input.paperId ?? undefined,
          paperTitle: input.paperTitle,
          authorName: input.authorName ?? undefined,
          track: input.track ?? undefined,
          condition: parsed.condition,
          recommendedAction: parsed.recommendedAction,
          executiveSummary: parsed.executiveSummary,
          scores: parsed.scores,
          analysis: parsed.analysis,
          reviewerGuidance: parsed.reviewerGuidance,
          originalityReport,
          evaluatedAt: new Date().toISOString(),
        };
      } catch (error) {
        console.warn("Gemini triage API call failed, falling back to heuristic triage:", error);
      }
    }

    // Fallback: Heuristic academic assessment
    return this.runHeuristicTriage(input, extractedDocText);
  }

  /**
   * Evaluates submissions with real-time response streaming (generateContentStream)
   * emitting progress, tokens, and completed structured assessment to callback listeners.
   */
  async triageSubmissionStream(
    input: AdminTriageInput,
    onEvent: (event: TriageStreamEvent) => void | Promise<void>,
  ): Promise<AdminTriageResult> {
    const { extractedDocText, isPdf } = await this.extractInputText(input);

    const gemini = getGeminiClient(input.apiKey);
    if (!gemini) {
      await onEvent({
        type: "progress",
        data: { phase: "fallback", message: "Running instant heuristic evaluation..." },
      });
      const result = this.runHeuristicTriage(input, extractedDocText);
      await onEvent({
        type: "complete",
        data: {
          success: true,
          condition: result.condition,
          recommendedAction: result.recommendedAction,
          result,
        },
      });
      return result;
    }

    try {
      await onEvent({
        type: "progress",
        data: { phase: "preparing", message: "Optimizing manuscript payload via Files API..." },
      });

      const { contents, plagiarismResult } = await prepareOptimizedContents({
        gemini,
        input,
        extractedDocText,
        isPdf,
        onProgress: async (msg) => {
          await onEvent({
            type: "progress",
            data: { phase: "uploading", message: msg },
          });
        },
      });

      await onEvent({
        type: "progress",
        data: { phase: "connecting", message: "Streaming live evaluation from Gemini 2.5 Flash..." },
      });

      const responseStream = await generateContentStreamWithFallback(gemini, {
        model: GEMINI_MODEL,
        contents,
        config: TRIAGE_GENERATION_CONFIG,
      });

      let accumulated = "";
      for await (const chunk of responseStream) {
        const token = chunk.text || "";
        if (token) {
          accumulated += token;
          await onEvent({
            type: "token",
            data: { token, accumulatedLength: accumulated.length },
          });
        }
      }

      const text = accumulated.trim() || "{}";
      const parsed = JSON.parse(text) as Omit<
        AdminTriageResult,
        "paperId" | "paperTitle" | "authorName" | "track" | "evaluatedAt"
      >;

      const originalityReport: OriginalityReport = parsed.originalityReport || {
        similarityScore: plagiarismResult.similarityScore,
        originalityScore: plagiarismResult.originalityScore,
        status: plagiarismResult.status,
        flaggedUrls: plagiarismResult.flaggedUrls,
        integritySummary: plagiarismResult.summary,
      };

      const finalResult: AdminTriageResult = {
        paperId: input.paperId ?? undefined,
        paperTitle: input.paperTitle,
        authorName: input.authorName ?? undefined,
        track: input.track ?? undefined,
        condition: parsed.condition,
        recommendedAction: parsed.recommendedAction,
        executiveSummary: parsed.executiveSummary,
        scores: parsed.scores,
        analysis: parsed.analysis,
        reviewerGuidance: parsed.reviewerGuidance,
        originalityReport,
        evaluatedAt: new Date().toISOString(),
      };

      await onEvent({
        type: "complete",
        data: {
          success: true,
          condition: finalResult.condition,
          recommendedAction: finalResult.recommendedAction,
          result: finalResult,
        },
      });

      return finalResult;
    } catch (err) {
      console.warn("Gemini streaming triage failed, falling back to heuristic evaluation:", err);
      const fallbackResult = this.runHeuristicTriage(input, extractedDocText);
      await onEvent({
        type: "complete",
        data: {
          success: true,
          condition: fallbackResult.condition,
          recommendedAction: fallbackResult.recommendedAction,
          result: fallbackResult,
        },
      });
      return fallbackResult;
    }
  }

  private runHeuristicTriage(input: AdminTriageInput, documentText: string): AdminTriageResult {
    const textToScan = `${input.paperTitle} ${input.abstract} ${documentText}`.toLowerCase();

    // Technical depth indicator signals
    const technicalKeywords = [
      "algorithm",
      "architecture",
      "optimization",
      "neural",
      "fpga",
      "vlsi",
      "throughput",
      "latency",
      "simulation",
      "benchmark",
      "dataset",
      "accuracy",
      "protocol",
      "hardware",
      "mathematical",
      "framework",
      "evaluation",
      "convergence",
      "beamforming",
      "mimo",
      "terahertz",
      "quantization",
      "microcontroller",
      "embedded",
      "sensor",
      "wireless",
      "power",
    ];

    const matchedKeywords = technicalKeywords.filter((kw) => textToScan.includes(kw));
    const technicalDensity = matchedKeywords.length;

    // Quality signals
    const abstractWords = (input.abstract || "").trim().split(/\s+/).filter(Boolean).length;
    const hasDetailedAbstract = abstractWords >= 25;
    const hasDocumentBody = Boolean(documentText && documentText.length > 80);

    let condition: DocumentCondition = "ACCEPTABLE";
    let recommendedAction: AdminAction = "REQUEST_CHANGES";

    let contentQualityScore = 7;
    let technicalDepthScore = 7;
    let noveltyScore = 7;
    let methodologyScore = 7;
    let clarityScore = 7;

    if (technicalDensity >= 6 && hasDetailedAbstract && hasDocumentBody) {
      condition = "EXCELLENT";
      recommendedAction = "APPROVE";
      contentQualityScore = 9;
      technicalDepthScore = 9;
      noveltyScore = 8;
      methodologyScore = 9;
      clarityScore = 9;
    } else if (technicalDensity >= 4 && hasDetailedAbstract) {
      condition = "ACCEPTABLE";
      recommendedAction = "APPROVE";
      contentQualityScore = 8;
      technicalDepthScore = 7;
      noveltyScore = 7;
      methodologyScore = 7;
      clarityScore = 8;
    } else if (technicalDensity >= 1 || hasDetailedAbstract || abstractWords >= 20) {
      condition = "NEEDS_REVISION";
      recommendedAction = "REQUEST_CHANGES";
      contentQualityScore = 6;
      technicalDepthScore = 5;
      noveltyScore = 6;
      methodologyScore = 5;
      clarityScore = 6;
    } else {
      condition = "POOR";
      recommendedAction = "REJECT";
      contentQualityScore = 3;
      technicalDepthScore = 3;
      noveltyScore = 3;
      methodologyScore = 3;
      clarityScore = 4;
    }

    const overallAssessmentScore = Math.round(
      ((contentQualityScore + technicalDepthScore + noveltyScore + methodologyScore + clarityScore) / 50) * 100,
    );

    const executiveSummary = `Executive Triage for "${input.paperTitle}" (${input.track ?? "General Track"}): The submission presents an investigation into ${input.paperTitle.toLowerCase()}, addressing engineering challenges. Evaluated condition is ${condition}, characterized by a technical depth score of ${technicalDepthScore}/10 and composite rating of ${overallAssessmentScore}%. Recommended administrative action is to ${recommendedAction}.`;

    const strengths: string[] = [
      `Clear relevance to track "${input.track || "General Engineering"}".`,
      hasDetailedAbstract ? "Well-articulated abstract summarizing research scope." : "Clear initial topic direction.",
      technicalDensity >= 4 ? "Utilizes established scientific domain terminology." : "Identifies an applicable problem space.",
    ];

    const weaknesses: string[] = [];
    if (!hasDocumentBody) {
      weaknesses.push("Full manuscript content not fully attached or accessible during triage.");
    }
    if (technicalDensity < 4) {
      weaknesses.push("Technical terminology and quantitative benchmark metrics appear sparse.");
    }
    if (abstractWords < 25) {
      weaknesses.push("Abstract is brief (<25 words); should provide fuller problem statement and quantified results.");
    }

    const flaggedConcerns: string[] = [];
    if (condition === "POOR") {
      flaggedConcerns.push("High risk of technical inadequacy; requires extensive revision or rejection.");
    } else if (condition === "NEEDS_REVISION") {
      flaggedConcerns.push("Clarification required on experimental methodology and baseline comparative analysis.");
    }

    const plagiarismScan = runLocalAcademicPlagiarismScan({
      text: `${input.paperTitle}\n${input.abstract}\n${documentText}`,
      title: input.paperTitle,
      author: input.authorName,
    });

    const originalityReport: OriginalityReport = {
      similarityScore: input.plagiarismMetrics?.similarityScore ?? plagiarismScan.similarityScore,
      originalityScore: input.plagiarismMetrics?.originalityScore ?? plagiarismScan.originalityScore,
      status: input.plagiarismMetrics?.similarityScore !== undefined
        ? (input.plagiarismMetrics.similarityScore > 25 ? "HIGH" : input.plagiarismMetrics.similarityScore >= 10 ? "MODERATE" : "CLEAN")
        : plagiarismScan.status,
      flaggedUrls: input.plagiarismMetrics?.flaggedUrls ?? plagiarismScan.flaggedUrls,
      integritySummary: plagiarismScan.summary,
    };

    return {
      paperId: input.paperId ?? undefined,
      paperTitle: input.paperTitle,
      authorName: input.authorName ?? undefined,
      track: input.track ?? undefined,
      condition,
      recommendedAction,
      executiveSummary,
      scores: {
        contentQuality: contentQualityScore,
        technicalDepth: technicalDepthScore,
        novelty: noveltyScore,
        methodologyRigor: methodologyScore,
        clarityAndOrganization: clarityScore,
        overallAssessmentScore,
      },
      analysis: {
        contentQualityAssessment: `The manuscript demonstrates ${condition.toLowerCase()} academic writing and problem presentation for the NCATEX conference.`,
        technicalDepthAssessment: `Technical rigor evaluated at ${technicalDepthScore}/10 with ${matchedKeywords.length} core engineering domain signals recognized.`,
        methodologicalEvaluation: `Methodology is categorized as ${condition.toLowerCase()}; recommendations target verifiable baselines and reproducibility.`,
        strengths,
        weaknesses,
        flaggedConcerns,
      },
      reviewerGuidance: {
        justificationForAction: `Action ${recommendedAction} determined based on composite score of ${overallAssessmentScore}% and ${condition} condition.`,
        suggestedReviewerFocus: [
          "Validate mathematical formulations and parameter choices.",
          "Check benchmark comparisons against modern state-of-the-art literature.",
          "Confirm reproducibility of reported experimental figures.",
        ],
        mandatoryRevisionsIfAny:
          condition === "NEEDS_REVISION"
            ? ["Expand experimental section with baseline comparisons.", "Refine abstract and keywords to meet standard conference thresholds."]
            : [],
      },
      originalityReport,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const adminReviewTriageService = new AdminReviewTriageService();
