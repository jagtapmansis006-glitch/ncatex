import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

// Mock the validation client module so Panels.tsx receives the mocked function
vi.mock("@/lib/ai-validation-client", () => ({
  validateStudentDocument: vi.fn(),
}));

import { SubmitModal, StudentPanel } from "../components/ncatex/Panels";
import { validateStudentDocument } from "@/lib/ai-validation-client";

describe("Student Panel File Upload & Validation UI (Panels.tsx)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("exports StudentPanel alias for SubmitModal", () => {
    expect(StudentPanel).toBe(SubmitModal);
  });

  it("renders the file upload dropzone and selection controls accepting .pdf, .doc, .docx", () => {
    render(<SubmitModal onClose={() => {}} onTrack={() => {}} />);

    // Dropzone labels and instructions
    expect(screen.getByText(/Manuscript Document Upload/i)).toBeDefined();
    expect(screen.getByText(/Accepts \.pdf, \.doc, \.docx/i)).toBeDefined();
    expect(screen.getByText(/Choose Document/i)).toBeDefined();
    expect(screen.getByText(/Drag and drop manuscript here/i)).toBeDefined();

    // File input element accepts .pdf, .doc, .docx
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    expect(fileInput.accept).toBe(".pdf,.doc,.docx");

    // Submit Report button is initially disabled
    const submitBtn = screen.getByRole("button", { name: /Submit Report/i }) as HTMLButtonElement;
    expect(submitBtn).toBeDefined();
    expect(submitBtn.disabled).toBe(true);
  });

  it("invokes validateStudentDocument on file selection and shows loading spinner", async () => {
    let resolveValidation: (value: any) => void;
    const validationPromise = new Promise((resolve) => {
      resolveValidation = resolve;
    });

    vi.mocked(validateStudentDocument).mockImplementation(() => validationPromise as any);

    render(<SubmitModal onClose={() => {}} onTrack={() => {}} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(["dummy pdf content"], "student_paper.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    expect(validateStudentDocument).toHaveBeenCalledWith(testFile);

    // Verify loading spinner and message are visible
    expect(screen.getByText(/AI Format Auditor is evaluating document/i)).toBeDefined();
    expect(
      screen.getByText(/Gemini AI is checking formatting, margins, fonts, and required sections/i),
    ).toBeDefined();

    // Resolve validation
    resolveValidation!({
      success: false,
      saved: false,
      status: "FAILED",
      canSubmit: false,
      result: {
        status: "FAILED",
        overallScore: 45,
        canSubmit: false,
        fileSaved: false,
        summaryMessage: "Document does not adhere to IEEE guidelines.",
        fonts: {
          status: "FAIL",
          detectedFonts: ["Comic Sans"],
          standardCompliance: false,
          feedback: ["Non-standard font Comic Sans detected."],
        },
        formatting: {
          status: "FAIL",
          margins: "0.5in",
          columnLayout: "single",
          lineSpacing: "single",
          feedback: ["Margins must be at least 0.75 inches."],
        },
        pageLayout: {
          status: "FAIL",
          pageCount: 3,
          headerFooterCorrect: false,
          visualStructure: "irregular",
          feedback: ["Column layout must be two columns."],
        },
        mandatorySections: [
          {
            sectionName: "Abstract",
            present: false,
            status: "MISSING",
            feedback: "Abstract is mandatory.",
          },
        ],
        studentActionableFeedback: [
          "Change font to Times New Roman or Arial.",
          "Add an Abstract section with research contribution.",
        ],
        evaluatedAt: new Date().toISOString(),
        fileMetadata: {
          filename: "student_paper.pdf",
          fileType: "pdf",
          fileSizeBytes: 1024,
        },
      },
    });

    await waitFor(() => {
      expect(screen.queryByText(/AI Format Auditor is evaluating document/i)).toBeNull();
    });
  });

  it("handles validation failure (canSubmit: false): displays formatting feedback card and keeps Submit Report button disabled", async () => {
    vi.mocked(validateStudentDocument).mockResolvedValue({
      success: false,
      saved: false,
      status: "FAILED",
      canSubmit: false,
      result: {
        status: "FAILED",
        overallScore: 40,
        canSubmit: false,
        fileSaved: false,
        summaryMessage: "Layout and typography checks failed.",
        fonts: {
          status: "FAIL",
          detectedFonts: ["Calibri"],
          standardCompliance: false,
          feedback: ["Font error: Calibri detected instead of Times New Roman."],
        },
        formatting: {
          status: "FAIL",
          margins: "0.5in",
          columnLayout: "single",
          lineSpacing: "single",
          feedback: ["Layout mistake: Top margin is smaller than 0.75in."],
        },
        pageLayout: {
          status: "FAIL",
          pageCount: 2,
          headerFooterCorrect: false,
          visualStructure: "single-column",
          feedback: ["Layout mistake: Paper must use standard double-column layout."],
        },
        mandatorySections: [
          {
            sectionName: "Methodology",
            present: false,
            status: "MISSING",
            feedback: "Methodology section was not detected.",
          },
        ],
        studentActionableFeedback: [
          "Format document as double-column IEEE format.",
          "Include a detailed Methodology section.",
        ],
        evaluatedAt: new Date().toISOString(),
        fileMetadata: {
          filename: "my_paper.docx",
          fileType: "docx",
          fileSizeBytes: 2048,
        },
      },
    });

    const { container } = render(<SubmitModal onClose={() => {}} onTrack={() => {}} />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const testDocx = new File(["docx content"], "my_paper.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    fireEvent.change(fileInput, { target: { files: [testDocx] } });

    expect(validateStudentDocument).toHaveBeenCalledWith(testDocx);

    await waitFor(() => {
      // Feedback card title & stopped badge
      expect(screen.getByText(/Format Checks Failed/i)).toBeDefined();
      expect(screen.getByText(/Upload Stopped • Unsaved/i)).toBeDefined();

      // Font errors
      expect(screen.getByText(/Font Errors:/i)).toBeDefined();
      expect(screen.getByText(/Calibri detected instead of Times New Roman/i)).toBeDefined();

      // Layout mistakes
      expect(screen.getByText(/Layout Mistakes:/i)).toBeDefined();
      expect(screen.getByText(/Top margin is smaller than 0\.75in/i)).toBeDefined();

      // Missing mandatory sections
      expect(screen.getByText(/Missing Mandatory Sections:/i)).toBeDefined();
      expect(screen.getByText(/Methodology section was not detected/i)).toBeDefined();

      // Actionable fix suggestions
      expect(screen.getByText(/Actionable Fix Suggestions:/i)).toBeDefined();
      expect(screen.getByText(/Format document as double-column IEEE format/i)).toBeDefined();
    });

    // Ensure Submit Report button remains disabled
    const submitBtn = screen.getByRole("button", { name: /Submit Report/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it("handles validation success (canSubmit: true): displays green Format Verified badge and enables submission", async () => {
    vi.mocked(validateStudentDocument).mockResolvedValue({
      success: true,
      saved: true,
      status: "PASSED",
      canSubmit: true,
      result: {
        status: "PASSED",
        overallScore: 96,
        canSubmit: true,
        fileSaved: true,
        summaryMessage: "All format and layout criteria are satisfied.",
        fonts: {
          status: "PASS",
          detectedFonts: ["Times New Roman"],
          standardCompliance: true,
          feedback: [],
        },
        formatting: {
          status: "PASS",
          margins: "0.75in",
          columnLayout: "double-column",
          lineSpacing: "single",
          feedback: [],
        },
        pageLayout: {
          status: "PASS",
          pageCount: 6,
          headerFooterCorrect: true,
          visualStructure: "compliant",
          feedback: [],
        },
        mandatorySections: [
          { sectionName: "Abstract", present: true, status: "FOUND", feedback: "Found" },
          { sectionName: "Introduction", present: true, status: "FOUND", feedback: "Found" },
          { sectionName: "Methodology", present: true, status: "FOUND", feedback: "Found" },
          { sectionName: "Results", present: true, status: "FOUND", feedback: "Found" },
          { sectionName: "Conclusion", present: true, status: "FOUND", feedback: "Found" },
          { sectionName: "References", present: true, status: "FOUND", feedback: "Found" },
        ],
        studentActionableFeedback: [],
        evaluatedAt: new Date().toISOString(),
        fileMetadata: {
          filename: "perfect_paper.pdf",
          fileType: "pdf",
          fileSizeBytes: 4096,
        },
      },
    });

    render(<SubmitModal onClose={() => {}} onTrack={() => {}} />);

    // Upload compliant file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(["valid pdf content"], "perfect_paper.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await waitFor(() => {
      // Green "Format Verified" badge is displayed
      expect(screen.getByText(/Format Verified/i)).toBeDefined();
      expect(screen.getByText(/Document Format Validated \(Score: 96\/100\)/i)).toBeDefined();
    });

    // When format is verified and track is selected, Submit Report button is enabled
    const submitBtn = screen.getByRole("button", { name: /Submit Report/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(false);
  });
});
