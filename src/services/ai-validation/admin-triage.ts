import { extractDocxContent } from "./docx-extractor";
import { extractPdfContent } from "./pdf-extractor";
import { getGeminiClient, GEMINI_MODEL, generateContentWithFallback } from "./gemini-client";
import { adminTriageSchema } from "./schemas";
import type {
  AdminTriageInput,
  AdminTriageResult,
  DocumentCondition,
  AdminAction,
} from "./types";

export class AdminReviewTriageService {
  /**
   * Evaluates approved submissions using gemini-3.8-flash with structured JSON output.
   * Analyzes content quality, technical depth, and condition (EXCELLENT, ACCEPTABLE, NEEDS_REVISION, POOR),
   * generating an executive summary and recommended action (APPROVE, REJECT, REQUEST_CHANGES).
   */
  async triageSubmission(input: AdminTriageInput): Promise<AdminTriageResult> {
    // Extract attached document content if provided
    let extractedDocText = input.fullText ?? "";
    let isDocx = false;
    let isPdf = false;
    let pdfData: ReturnType<typeof extractPdfContent> | null = null;

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
          pdfData = extractPdfContent(input.documentBuffer);
          if (pdfData.extractedSnippet) {
            extractedDocText += `\n\n[PDF Snippet]: ${pdfData.extractedSnippet}`;
          }
        } catch (e) {
          console.warn("Failed to extract PDF in triage:", e);
        }
      }
    }

    const gemini = getGeminiClient(input.apiKey);

    if (gemini) {
      try {
        return await this.callGeminiTriage({
          gemini,
          input,
          extractedDocText,
          pdfData,
          isPdf,
        });
      } catch (error) {
        console.warn("Gemini triage API call failed, falling back to heuristic triage:", error);
      }
    }

    // Fallback: Heuristic academic assessment
    return this.runHeuristicTriage(input, extractedDocText);
  }

  private async callGeminiTriage({
    gemini,
    input,
    extractedDocText,
    pdfData,
    isPdf,
  }: {
    gemini: NonNullable<ReturnType<typeof getGeminiClient>>;
    input: AdminTriageInput;
    extractedDocText: string;
    pdfData: ReturnType<typeof extractPdfContent> | null;
    isPdf: boolean;
  }): Promise<AdminTriageResult> {
    const prompt = `
You are the Technical Program Committee (TPC) Chair and Chief Academic Editor for the 2nd National Conference on Advanced Trends in Engineering (NCATEX).
You are conducting executive triage and rigorous peer review on a submitted manuscript.

[SUBMISSION DETAILS]:
- Paper ID: ${input.paperId ?? "N/A"}
- Title: ${input.paperTitle}
- Author: ${input.authorName ?? "Anonymous"}
- Department: ${input.department ?? "Engineering"}
- Track: ${input.track ?? "General Engineering"}
- Abstract:
${input.abstract}

${extractedDocText ? `\n[MANUSCRIPT BODY / EXTRACTED CONTENT]:\n${extractedDocText.slice(0, 40000)}` : ""}

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
6. Assign scores (1-10) for contentQuality, technicalDepth, novelty, methodologyRigor, clarityAndOrganization, and composite overallAssessmentScore (0-100).
7. Detail key strengths, weaknesses, flagged concerns, and specific focus areas for reviewers.
`;

    const contents: Array<string | { inlineData: { mimeType: string; data: string } }> = [];

    if (isPdf && pdfData) {
      contents.push({
        inlineData: {
          mimeType: "application/pdf",
          data: pdfData.base64Data,
        },
      });
    }
    contents.push(prompt);

    const response = await generateContentWithFallback(gemini, {
      model: GEMINI_MODEL,
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: adminTriageSchema,
        temperature: 0.25,
      },
    });

    const text = response.text?.trim() ?? "{}";
    const parsed = JSON.parse(text) as Omit<AdminTriageResult, "paperId" | "paperTitle" | "authorName" | "track" | "evaluatedAt">;

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
      evaluatedAt: new Date().toISOString(),
    };
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
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const adminReviewTriageService = new AdminReviewTriageService();
