import { describe, it, expect, vi, beforeEach } from "vitest";
import mammoth from "mammoth";
import { studentDocumentValidator } from "../services/ai-validation/student-validator";
import { adminReviewTriageService } from "../services/ai-validation/admin-triage";
import { handleAiValidationRequest } from "../server/ai-validation-middleware";
import { extractPdfContent } from "../services/ai-validation/pdf-extractor";
import { extractDocxContent } from "../services/ai-validation/docx-extractor";
import { GEMINI_MODEL } from "../services/ai-validation/gemini-client";
import {
  analyzeStudentDocumentHandler,
  submitPaperHandler,
  triageAdminSubmissionHandler,
} from "../server/ai-validation-functions";
import { supabase } from "../lib/supabase";

const SAMPLE_COMPLIANT_MANUSCRIPT_PDF =
  `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R >>
stream
BT
/F1 12 Tf
Title: Deep Neural Accelerators on Heterogeneous FPGA
Author: Aarav Sharma, Department of Electronics, NCATEX University
Abstract: This paper presents an optimized energy-efficient accelerator for edge devices.
Keywords: Neural Networks, FPGA, Edge AI, Optimization
Introduction: The proliferation of edge computing demands low-power silicon implementations.
Related Work: Prior literature has focused on systolic arrays.
Methodology: Our proposed architecture incorporates mixed-precision systolic processing.
Results & Discussion: The experimental performance evaluation demonstrates a 3.4x speedup.
Conclusion: In conclusion, the framework achieves state-of-the-art throughput.
References: [1] J. Doe, IEEE Trans. VLSI, 2024.
ET
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF` + " ".repeat(3000);

describe("Dual-Persona AI Validation Layer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Persona 1: Student Document Analysis", () => {
    it("rejects unsupported file formats without saving", async () => {
      const dummyBuffer = Buffer.from("random binary content");
      const result = await studentDocumentValidator.analyzeDocument({
        filename: "unsupported.exe",
        buffer: dummyBuffer,
      });

      expect(result.status).toBe("FAILED");
      expect(result.canSubmit).toBe(false);
      expect(result.fileSaved).toBe(false); // Must not save
      expect(result.studentActionableFeedback.length).toBeGreaterThan(0);
      expect(result.studentActionableFeedback[0]).toContain(
        "convert your manuscript to PDF (.pdf) or Microsoft Word (.docx)",
      );
    });

    it("evaluates a deficient PDF manuscript and enforces fileSaved = false", async () => {
      const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
trailer
<< /Root 1 0 R >>
%%EOF`;

      const buffer = Buffer.from(pdfContent, "utf-8");
      const result = await studentDocumentValidator.analyzeDocument({
        filename: "student_incomplete_paper.pdf",
        buffer,
        mimeType: "application/pdf",
      });

      // Expect failure due to missing core sections
      expect(result.status).toBe("FAILED");
      expect(result.canSubmit).toBe(false);
      expect(result.fileSaved).toBe(false); // CRITICAL: file must NOT be saved

      // Check mandatory sections feedback
      const abstractCheck = result.mandatorySections.find((s) => s.sectionName === "Abstract");
      expect(abstractCheck?.present).toBe(false);
      expect(abstractCheck?.status).toBe("MISSING");

      const refsCheck = result.mandatorySections.find((s) => s.sectionName === "References");
      expect(refsCheck?.present).toBe(false);

      // Check student actionable feedback
      expect(result.studentActionableFeedback.length).toBeGreaterThan(0);
      expect(result.summaryMessage).toContain("NOT saved");
    });

    it("correctly identifies sections in a comprehensive PDF manuscript", async () => {
      const buffer = Buffer.from(SAMPLE_COMPLIANT_MANUSCRIPT_PDF, "utf-8");
      const result = await studentDocumentValidator.analyzeDocument({
        filename: "comprehensive_manuscript.pdf",
        buffer,
        mimeType: "application/pdf",
      });

      expect(result.status).not.toBe("FAILED");
      expect(result.canSubmit).toBe(true);

      const abstract = result.mandatorySections.find((s) => s.sectionName === "Abstract");
      expect(abstract?.present).toBe(true);

      const intro = result.mandatorySections.find((s) => s.sectionName === "Introduction");
      expect(intro?.present).toBe(true);

      const methodology = result.mandatorySections.find(
        (s) => s.sectionName === "Methodology / Proposed Architecture",
      );
      expect(methodology?.present).toBe(true);
    });

    it("prepares PDF multimodal inlineData correctly", () => {
      const rawPdf = "%PDF-1.4\n/Type /Page\n/Type /Page\nBT (Title) Tj ET\n%%EOF";
      const buffer = Buffer.from(rawPdf, "utf-8");
      const extracted = extractPdfContent(buffer);

      expect(extracted.mimeType).toBe("application/pdf");
      expect(extracted.base64Data).toBe(buffer.toString("base64"));
      expect(extracted.estimatedPageCount).toBe(2);
      expect(extracted.extractedSnippet).toContain("Title");
    });

    it("extracts and validates DOCX documents using mammoth", async () => {
      // Mock mammoth functions to simulate DOCX extraction
      const mockRawText =
        "Title: Edge AI Accelerators\nAuthor: John Doe, Engineering\nAbstract: This paper explores edge neural networks.\nKeywords: AI, Edge\nIntroduction: Introduction text here.\nMethodology: Proposed architecture.\nResults: Simulation results.\nReferences: [1] Ref 2025.";
      const mockMarkdown =
        "# Title: Edge AI Accelerators\n## Abstract\nThis paper explores edge neural networks.\n## Introduction\nIntroduction text.\n## Methodology\nProposed architecture.\n## Results\nSimulation results.\n## References\n[1] Ref 2025.";

      vi.spyOn(mammoth, "extractRawText").mockResolvedValue({
        value: mockRawText,
        messages: [],
      });
      // @ts-expect-error Mocking convertToMarkdown if present
      mammoth.convertToMarkdown = vi.fn().mockResolvedValue({ value: mockMarkdown, messages: [] });

      const fakeDocxBuffer = Buffer.from("PK\x03\x04fake-docx-content" + " ".repeat(3000));
      const extracted = await extractDocxContent(fakeDocxBuffer);

      expect(extracted.rawText).toContain("Edge AI Accelerators");
      expect(extracted.wordCount).toBeGreaterThan(10);
      expect(extracted.detectedSections).toContain("Abstract");
      expect(extracted.detectedSections).toContain("Introduction");
      expect(extracted.detectedSections).toContain("Methodology");

      const validationResult = await studentDocumentValidator.analyzeDocument({
        filename: "student_submission.docx",
        buffer: fakeDocxBuffer,
      });

      expect(validationResult.fileMetadata.fileType).toBe("docx");
      expect(validationResult.canSubmit).toBe(true);
    });
  });

  describe("Persona 2: Admin Review & Triage", () => {
    it("triages an excellent high-depth submission to APPROVE with condition EXCELLENT", async () => {
      const input = {
        paperId: "NCATEX-901",
        paperTitle: "Real-Time Beamforming & Massive MIMO Optimization for 6G Terahertz Networks",
        authorName: "Dr. Vikram Seth",
        department: "Telecommunications Engineering",
        track: "5G & Next-Gen Wireless Communications",
        abstract:
          "This paper introduces an algorithmic framework for adaptive beamforming in sub-terahertz massive MIMO configurations. We develop a novel alternating minimization algorithm with guaranteed convergence. Extensive hardware simulations on 28nm FPGA demonstrate sub-microsecond latency, 40 Gbps throughput, and a 28% reduction in RF power consumption benchmarked against conventional hybrid precoding architectures.",
        fullText:
          "Section I. Introduction... Section II. Mathematical System Model and channel matrices... Section III. Optimization algorithm formulation and proof of convergence... Section IV. Hardware simulation and benchmark dataset results showing 99.4% accuracy and minimal latency.",
      };

      const triage = await adminReviewTriageService.triageSubmission(input);

      expect(triage.paperTitle).toBe(input.paperTitle);
      expect(triage.condition).toBe("EXCELLENT");
      expect(triage.recommendedAction).toBe("APPROVE");
      expect(triage.scores.technicalDepth).toBeGreaterThanOrEqual(8);
      expect(triage.scores.contentQuality).toBeGreaterThanOrEqual(8);
      expect(triage.scores.overallAssessmentScore).toBeGreaterThanOrEqual(80);
      expect(triage.executiveSummary).toContain("Real-Time Beamforming");
      expect(triage.analysis.strengths.length).toBeGreaterThan(0);
      expect(triage.reviewerGuidance.justificationForAction).toBeDefined();
    });

    it("triages a superficial submission to REJECT or REQUEST_CHANGES with condition POOR or NEEDS_REVISION", async () => {
      const input = {
        paperId: "NCATEX-902",
        paperTitle: "A Brief Look at Modern Computers",
        authorName: "Student Anonymous",
        department: "General",
        track: "Artificial Intelligence & Machine Learning",
        abstract: "Computers are very fast and useful in daily life.",
      };

      const triage = await adminReviewTriageService.triageSubmission(input);

      expect(["POOR", "NEEDS_REVISION"]).toContain(triage.condition);
      expect(["REJECT", "REQUEST_CHANGES"]).toContain(triage.recommendedAction);
      expect(triage.scores.technicalDepth).toBeLessThanOrEqual(6);
      expect(triage.analysis.weaknesses.length).toBeGreaterThan(0);
    });

    it("triages a promising submission requiring revisions to REQUEST_CHANGES", async () => {
      const input = {
        paperId: "NCATEX-903",
        paperTitle: "Exploration of CNN Quantization on Microcontrollers",
        authorName: "Pooja V.",
        department: "Computer Science",
        track: "Artificial Intelligence & Machine Learning",
        abstract:
          "We explore post-training quantization on small convolutional networks for embedded microcontrollers. Preliminary accuracy on MNIST reaches 95%. However, memory constraints require further testing on real sensor data.",
      };

      const triage = await adminReviewTriageService.triageSubmission(input);

      expect(["NEEDS_REVISION", "ACCEPTABLE"]).toContain(triage.condition);
      expect(["REQUEST_CHANGES", "APPROVE"]).toContain(triage.recommendedAction);
      expect(triage.scores.overallAssessmentScore).toBeGreaterThanOrEqual(50);
    });
  });

  describe("Standalone HTTP Middleware & Endpoints", () => {
    it("handles health check endpoint GET /api/ai/health", async () => {
      const req = new Request("http://localhost:3000/api/ai/health", { method: "GET" });
      const res = await handleAiValidationRequest(req);

      expect(res).not.toBeNull();
      expect(res?.status).toBe(200);

      const body = (await res?.json()) as { status: string; model: string; endpoints: unknown[] };
      expect(body.status).toBe("online");
      expect(body.model).toBe(GEMINI_MODEL);
      expect(body.endpoints.length).toBe(2);
    });

    it("handles student validation endpoint POST /api/student/validate-document via JSON", async () => {
      const base64 = Buffer.from(SAMPLE_COMPLIANT_MANUSCRIPT_PDF).toString("base64");

      const req = new Request("http://localhost:3000/api/student/validate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "test_student_paper.pdf",
          base64,
          mimeType: "application/pdf",
        }),
      });

      const res = await handleAiValidationRequest(req);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(200);

      const data = (await res?.json()) as { success: boolean; result: unknown };
      expect(data.success).toBe(true);
      expect(data.result).toBeDefined();
    });

    it("rejects incomplete student document with 422 and saved=false", async () => {
      const dummyPdf = "%PDF-1.4\nTiny incomplete document\n%%EOF";
      const base64 = Buffer.from(dummyPdf).toString("base64");

      const req = new Request("http://localhost:3000/api/student/validate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "bad_student_paper.pdf",
          base64,
          mimeType: "application/pdf",
        }),
      });

      const res = await handleAiValidationRequest(req);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(422);

      const data = (await res?.json()) as { success: boolean; saved: boolean; status: string };
      expect(data.success).toBe(false);
      expect(data.saved).toBe(false); // CRITICAL: file not saved
      expect(data.status).toBe("FAILED");
    });

    it("handles admin triage endpoint POST /api/admin/triage-submission via JSON", async () => {
      const req = new Request("http://localhost:3000/api/admin/triage-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperTitle: "Adaptive Neural Compression on RISC-V",
          authorName: "Neha Sharma",
          track: "VLSI & Embedded Systems",
          abstract:
            "A hardware-software co-designed neural compression engine running on open-source RISC-V cores. Evaluated on hardware emulation with significant throughput gains.",
        }),
      });

      const res = await handleAiValidationRequest(req);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(200);

      const data = (await res?.json()) as {
        success: boolean;
        condition: string;
        recommendedAction: string;
        result: { scores: { technicalDepth: number } };
      };
      expect(data.success).toBe(true);
      expect(["EXCELLENT", "ACCEPTABLE", "NEEDS_REVISION"]).toContain(data.condition);
      expect(["APPROVE", "REQUEST_CHANGES"]).toContain(data.recommendedAction);
      expect(data.result.scores.technicalDepth).toBeGreaterThan(0);
    });

    it("returns null for unrelated routes to let other handlers proceed", async () => {
      const req = new Request("http://localhost:3000/some-other-endpoint", { method: "GET" });
      const res = await handleAiValidationRequest(req);
      expect(res).toBeNull();
    });
  });

  describe("Server Functions Execution", () => {
    it("executes analyzeStudentDocumentHandler correctly", async () => {
      const base64 = Buffer.from(SAMPLE_COMPLIANT_MANUSCRIPT_PDF).toString("base64");
      const result = await analyzeStudentDocumentHandler({
        filename: "sample.pdf",
        base64,
        mimeType: "application/pdf",
      });

      expect(result).toBeDefined();
      expect(result.status).not.toBe("FAILED");
      expect(result.canSubmit).toBe(true);
    });

    it("executes triageAdminSubmissionHandler correctly", async () => {
      const result = await triageAdminSubmissionHandler({
        paperTitle: "Hardware Accelerator for Graph Neural Networks",
        authorName: "Ananya Roy",
        abstract:
          "This paper develops an FPGA hardware accelerator for graph neural networks with sparse matrix multiplication optimization, evaluated on benchmark citation graphs with latency reduction.",
        track: "VLSI & Embedded Systems",
      });

      expect(result).toBeDefined();
      expect(["EXCELLENT", "ACCEPTABLE", "NEEDS_REVISION"]).toContain(result.condition);
      expect(result.scores.overallAssessmentScore).toBeGreaterThan(0);
    });

    it("executes submitPaperHandler, uploads PDF to paper-drafts, and inserts pdf_url", async () => {
      const dummyPdf = Buffer.from(SAMPLE_COMPLIANT_MANUSCRIPT_PDF);
      const preResult = {
        status: "PASSED" as const,
        overallScore: 92,
        canSubmit: true,
        fileSaved: false,
        formatting: {
          status: "PASS" as const,
          margins: "0.75in",
          columnLayout: "two-column",
          lineSpacing: "single",
          feedback: [],
        },
        fonts: {
          status: "PASS" as const,
          detectedFonts: ["Times New Roman"],
          standardCompliance: true,
          feedback: [],
        },
        pageLayout: {
          status: "PASS" as const,
          pageCount: 5,
          headerFooterCorrect: true,
          visualStructure: "normal",
          feedback: [],
        },
        mandatorySections: [],
        studentActionableFeedback: [],
        summaryMessage: "Document passes all guidelines.",
        evaluatedAt: new Date().toISOString(),
        fileMetadata: {
          filename: "test_submission.pdf",
          fileType: "pdf" as const,
          fileSizeBytes: dummyPdf.length,
        },
      };

      const result = await submitPaperHandler({
        authorName: "Test Student",
        authorEmail: "test.student@ncatex.edu",
        department: "Computer Science",
        track: "Artificial Intelligence & Machine Learning",
        paperTitle: "Test Paper For Vitest Pipeline",
        abstract: "A test abstract.",
        filename: "vitest_paper.pdf",
        buffer: dummyPdf,
        preValidatedResult: preResult,
      });

      expect(result.success).toBe(true);
      expect(result.saved).toBe(true);
      expect(result.pdfUrl).toContain("paper-drafts");
      expect(result.paper).toBeDefined();
      expect(result.paper.pdf_url || result.paper.file_url).toBe(result.pdfUrl);

      // Clean up test records
      if (result.paper.id) {
        await supabase.from("papers").delete().eq("id", result.paper.id);
      }
      if (result.storagePath) {
        await supabase.storage.from("paper-drafts").remove([result.storagePath]);
      }
    });

    it("throws a clear error if manuscript file buffer is missing in submitPaperHandler", async () => {
      await expect(
        submitPaperHandler({
          authorName: "Missing Buffer",
          authorEmail: "missing@test.com",
          paperTitle: "No File",
          abstract: "Abstract",
          filename: "empty.pdf",
          buffer: Buffer.from(""),
        }),
      ).rejects.toThrow("Manuscript file buffer is empty or missing");
    });
  });
});
