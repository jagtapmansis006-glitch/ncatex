import { Type, type Schema } from "@google/genai";

/**
 * Structured output JSON schema for Student Document Validation using gemini-3.8-flash
 */
export const studentValidationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    status: {
      type: Type.STRING,
      enum: ["PASSED", "FAILED", "WARNINGS"],
      description: "Overall validation verdict: PASSED if ready, FAILED if format checks fail, WARNINGS if minor non-blocking issues exist",
    },
    overallScore: {
      type: Type.INTEGER,
      description: "Compliance score from 0 to 100 based on format, font, and section adherence",
    },
    canSubmit: {
      type: Type.BOOLEAN,
      description: "True if the student is cleared to submit, false if formatting or section errors must be corrected",
    },
    fileSaved: {
      type: Type.BOOLEAN,
      description: "Strictly false if format checks fail (status is FAILED)",
    },
    formatting: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ["PASS", "FAIL", "WARNING"] },
        margins: { type: Type.STRING, description: "Assessment of margins (e.g. standard 0.75-1 inch margins)" },
        columnLayout: { type: Type.STRING, description: "Assessment of column format (e.g. IEEE two-column vs single-column)" },
        lineSpacing: { type: Type.STRING, description: "Line spacing assessment (single or 1.15 spacing)" },
        feedback: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Formatting observations and corrections needed",
        },
      },
      required: ["status", "margins", "columnLayout", "lineSpacing", "feedback"],
    },
    fonts: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ["PASS", "FAIL", "WARNING"] },
        detectedFonts: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Fonts detected in the document (e.g. Times New Roman, Arial, Calibri)",
        },
        standardCompliance: {
          type: Type.BOOLEAN,
          description: "True if academic standard fonts and hierarchical sizes are respected",
        },
        feedback: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Font feedback regarding sizing, weights, and consistency",
        },
      },
      required: ["status", "detectedFonts", "standardCompliance", "feedback"],
    },
    pageLayout: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ["PASS", "FAIL", "WARNING"] },
        pageCount: { type: Type.INTEGER, description: "Estimated or detected page count" },
        headerFooterCorrect: { type: Type.BOOLEAN, description: "True if headers, footers, or page numbers follow conference norms" },
        visualStructure: { type: Type.STRING, description: "Notes on figure placement, table alignment, or caption styles" },
        feedback: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Page layout feedback and layout improvements",
        },
      },
      required: ["status", "headerFooterCorrect", "visualStructure", "feedback"],
    },
    mandatorySections: {
      type: Type.ARRAY,
      description: "List of required academic sections evaluated",
      items: {
        type: Type.OBJECT,
        properties: {
          sectionName: { type: Type.STRING, description: "Standard section name (e.g. Title, Abstract, Introduction, Methodology, etc.)" },
          present: { type: Type.BOOLEAN, description: "True if section is identified in document" },
          status: { type: Type.STRING, enum: ["FOUND", "MISSING", "INCOMPLETE"] },
          feedback: { type: Type.STRING, description: "Specific comments on section presence, length, and quality" },
          detectedHeading: { type: Type.STRING, description: "Actual heading text found in the manuscript" },
        },
        required: ["sectionName", "present", "status", "feedback"],
      },
    },
    studentActionableFeedback: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Clear, itemized instructions for the student to resolve formatting or missing elements before submission",
    },
    summaryMessage: {
      type: Type.STRING,
      description: "Encouraging and directive executive statement for the student",
    },
  },
  required: [
    "status",
    "overallScore",
    "canSubmit",
    "fileSaved",
    "formatting",
    "fonts",
    "pageLayout",
    "mandatorySections",
    "studentActionableFeedback",
    "summaryMessage",
  ],
};

/**
 * Structured output JSON schema for Admin Review & Triage using gemini-3.8-flash
 */
export const adminTriageSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    condition: {
      type: Type.STRING,
      enum: ["EXCELLENT", "ACCEPTABLE", "NEEDS_REVISION", "POOR"],
      description: "Overall condition and readiness level of the submission",
    },
    recommendedAction: {
      type: Type.STRING,
      enum: ["APPROVE", "REJECT", "REQUEST_CHANGES"],
      description: "Triage decision recommendation for conference chairs and reviewers",
    },
    executiveSummary: {
      type: Type.STRING,
      description: "High-level executive briefing summarizing scientific contribution, methodology, and key takeaway (2-4 sentences)",
    },
    scores: {
      type: Type.OBJECT,
      properties: {
        contentQuality: { type: Type.INTEGER, description: "Score 1-10 on academic writing, clarity, and structural coherence" },
        technicalDepth: { type: Type.INTEGER, description: "Score 1-10 on algorithmic, mathematical, or engineering depth" },
        novelty: { type: Type.INTEGER, description: "Score 1-10 on novelty and original contribution" },
        methodologyRigor: { type: Type.INTEGER, description: "Score 1-10 on experimental validity, dataset quality, and reproducibility" },
        clarityAndOrganization: { type: Type.INTEGER, description: "Score 1-10 on organization and precision" },
        overallAssessmentScore: { type: Type.INTEGER, description: "Composite score from 0-100" },
      },
      required: [
        "contentQuality",
        "technicalDepth",
        "novelty",
        "methodologyRigor",
        "clarityAndOrganization",
        "overallAssessmentScore",
      ],
    },
    analysis: {
      type: Type.OBJECT,
      properties: {
        contentQualityAssessment: { type: Type.STRING, description: "In-depth review of content clarity, academic tone, and communication" },
        technicalDepthAssessment: { type: Type.STRING, description: "Detailed analysis of technical rigor, formulas, architecture, and empirical claims" },
        methodologicalEvaluation: { type: Type.STRING, description: "Critique of methodology, experimental setup, and baselines" },
        strengths: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Key strengths of the paper",
        },
        weaknesses: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Technical or expository weaknesses",
        },
        flaggedConcerns: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Red flags or concerns (e.g. weak baselines, missing ablation, vague data)",
        },
      },
      required: [
        "contentQualityAssessment",
        "technicalDepthAssessment",
        "methodologicalEvaluation",
        "strengths",
        "weaknesses",
        "flaggedConcerns",
      ],
    },
    reviewerGuidance: {
      type: Type.OBJECT,
      properties: {
        justificationForAction: { type: Type.STRING, description: "Why the APPROVE/REJECT/REQUEST_CHANGES action was assigned" },
        suggestedReviewerFocus: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Specific aspects peer reviewers should verify or scrutinize",
        },
        mandatoryRevisionsIfAny: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Required revisions before acceptance",
        },
      },
      required: ["justificationForAction", "suggestedReviewerFocus", "mandatoryRevisionsIfAny"],
    },
    originalityReport: {
      type: Type.OBJECT,
      properties: {
        similarityScore: { type: Type.INTEGER, description: "Plagiarism match percentage (0-100)" },
        originalityScore: { type: Type.INTEGER, description: "Originality score percentage (0-100)" },
        status: { type: Type.STRING, enum: ["CLEAN", "MODERATE", "HIGH"], description: "Risk status based on similarity threshold" },
        flaggedUrls: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of matched public or academic source URLs",
        },
        integritySummary: {
          type: Type.STRING,
          description: "Dedicated Originality & Integrity Report synthesizing manuscript originality, matched sources, and academic integrity evaluation",
        },
      },
      required: ["similarityScore", "originalityScore", "status", "flaggedUrls", "integritySummary"],
    },
  },
  required: [
    "condition",
    "recommendedAction",
    "executiveSummary",
    "scores",
    "analysis",
    "reviewerGuidance",
    "originalityReport",
  ],
};
