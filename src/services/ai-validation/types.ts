export type ValidationStatus = "PASSED" | "FAILED" | "WARNINGS";

export type CheckStatus = "PASS" | "FAIL" | "WARNING";

export type SectionStatus = "FOUND" | "MISSING" | "INCOMPLETE";

export type DocumentCondition = "EXCELLENT" | "ACCEPTABLE" | "NEEDS_REVISION" | "POOR";

export type AdminAction = "APPROVE" | "REJECT" | "REQUEST_CHANGES";

export interface MandatorySectionCheck {
  sectionName: string;
  present: boolean;
  status: SectionStatus;
  feedback: string;
  detectedHeading?: string | undefined;
}

export interface StudentFormattingCheck {
  status: CheckStatus;
  margins: string;
  columnLayout: string;
  lineSpacing: string;
  feedback: string[];
}

export interface StudentFontCheck {
  status: CheckStatus;
  detectedFonts: string[];
  standardCompliance: boolean;
  feedback: string[];
}

export interface StudentPageLayoutCheck {
  status: CheckStatus;
  pageCount: number | null;
  headerFooterCorrect: boolean;
  visualStructure: string;
  feedback: string[];
}

export interface StudentValidationResult {
  status: ValidationStatus;
  overallScore: number; // 0 - 100
  canSubmit: boolean;
  fileSaved: boolean; // Must be false if format checks fail
  formatting: StudentFormattingCheck;
  fonts: StudentFontCheck;
  pageLayout: StudentPageLayoutCheck;
  mandatorySections: MandatorySectionCheck[];
  studentActionableFeedback: string[];
  summaryMessage: string;
  evaluatedAt: string;
  fileMetadata: {
    filename: string;
    fileType: "pdf" | "docx" | "unknown";
    fileSizeBytes: number;
    wordCount?: number | undefined;
    extractedSnippet?: string | undefined;
  };
}

export interface AdminTriageScores {
  contentQuality: number; // 1 - 10
  technicalDepth: number; // 1 - 10
  novelty: number; // 1 - 10
  methodologyRigor: number; // 1 - 10
  clarityAndOrganization: number; // 1 - 10
  overallAssessmentScore: number; // 0 - 100
}

export interface AdminTriageResult {
  paperId?: string | undefined;
  paperTitle: string;
  authorName?: string | undefined;
  track?: string | undefined;
  condition: DocumentCondition;
  recommendedAction: AdminAction;
  executiveSummary: string;
  scores: AdminTriageScores;
  analysis: {
    contentQualityAssessment: string;
    technicalDepthAssessment: string;
    methodologicalEvaluation: string;
    strengths: string[];
    weaknesses: string[];
    flaggedConcerns: string[];
  };
  reviewerGuidance: {
    justificationForAction: string;
    suggestedReviewerFocus: string[];
    mandatoryRevisionsIfAny: string[];
  };
  evaluatedAt: string;
}

export interface DocumentAnalysisInput {
  filename: string;
  buffer: Buffer | Uint8Array;
  mimeType?: string | undefined;
  apiKey?: string | undefined;
}

export interface AdminTriageInput {
  paperId?: string | undefined;
  paperTitle: string;
  authorName?: string | undefined;
  department?: string | undefined;
  track?: string | undefined;
  abstract: string;
  fullText?: string | undefined;
  documentBuffer?: Buffer | Uint8Array | undefined;
  documentFilename?: string | undefined;
  documentMimeType?: string | undefined;
  apiKey?: string | undefined;
}
