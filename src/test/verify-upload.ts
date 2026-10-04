import { handleAiValidationRequest } from "../server/ai-validation-middleware";
import { GEMINI_MODEL } from "../services/ai-validation/gemini-client";
import { supabase } from "../lib/supabase";

async function runVerification() {
  console.log("================================================================");
  console.log("       LIVE API VERIFICATION & DOCUMENT UPLOAD PIPELINE        ");
  console.log("================================================================");
  console.log("Active Gemini Model:       ", GEMINI_MODEL);
  const envKey = (globalThis as unknown as { process?: { env?: Record<string, string> } })?.process?.env?.["GEMINI_API_KEY"];
  console.log("GEMINI_API_KEY Configured: ", Boolean(envKey));

  const compliantPdfContent =
    "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R >>\nstream\nBT\n/F1 12 Tf\n" +
    "Title: Energy-Efficient Neuromorphic Processing for 6G IoT Edge Systems\n" +
    "Author: Aarav Sharma, Dept of Telecommunications, NCATEX Institute\n" +
    "Abstract: This paper presents an energy-efficient neuromorphic accelerator architecture for ultra-low latency edge inferencing in 6G wireless Internet of Things networks. Evaluated on hardware emulation with significant speedup.\n" +
    "Keywords: Neuromorphic Computing, 6G Wireless, Edge AI, FPGA, Energy Efficiency\n" +
    "Introduction: The rapid expansion of edge computing devices requires real-time signal intelligence with minimal power dissipation.\n" +
    "Related Work: Prior literature on edge TPU and systolic architectures reveals high memory bandwidth bottlenecks.\n" +
    "Methodology / Proposed Architecture: We propose a mixed-precision spiking neural network accelerator with asynchronous event processing.\n" +
    "Results & Discussion: Benchmark results on standard sensor datasets demonstrate a 3.8x reduction in latency and 42% power savings.\n" +
    "Conclusion & Future Work: The architecture proves viable for extreme edge deployment; future work focuses on monolithic 3D integration.\n" +
    "References: [1] J. Doe et al., IEEE Transactions on Circuits and Systems, 2025.\n" +
    "ET\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF" +
    " ".repeat(3500);

  const pdfBuffer = Buffer.from(compliantPdfContent, "utf-8");

  // TEST 1: Full Submission Pipeline: PDF Upload to 'paper-drafts' -> Public URL -> DB Insert with pdf_url
  console.log("\n--- TEST 1: Manuscript Submission Pipeline (Storage Upload & DB Insert) ---");
  const compliantResult = {
    status: "PASSED" as const,
    overallScore: 88,
    canSubmit: true,
    fileSaved: false,
    formatting: {
      status: "PASS" as const,
      margins: "0.75-inch standard",
      columnLayout: "Two-column conference layout",
      lineSpacing: "Single-spaced, 10pt body text",
      feedback: ["IEEE double-column format validated."],
    },
    fonts: {
      status: "PASS" as const,
      detectedFonts: ["Times New Roman", "Helvetica"],
      standardCompliance: true,
      feedback: ["Standard font compliance verified."],
    },
    pageLayout: {
      status: "PASS" as const,
      pageCount: 6,
      headerFooterCorrect: true,
      visualStructure: "Two-column scientific layout",
      feedback: ["Header and footer correct."],
    },
    mandatorySections: [
      { sectionName: "Title", present: true, status: "FOUND" as const, feedback: "Title detected." },
      { sectionName: "Abstract", present: true, status: "FOUND" as const, feedback: "Abstract detected." },
      { sectionName: "Introduction", present: true, status: "FOUND" as const, feedback: "Introduction detected." },
      { sectionName: "Methodology / Proposed Architecture", present: true, status: "FOUND" as const, feedback: "Methodology detected." },
      { sectionName: "Results & Discussion", present: true, status: "FOUND" as const, feedback: "Results detected." },
      { sectionName: "Conclusion & Future Work", present: true, status: "FOUND" as const, feedback: "Conclusion detected." },
      { sectionName: "References", present: true, status: "FOUND" as const, feedback: "References detected." },
    ],
    studentActionableFeedback: ["Document formatting conforms to conference publication guidelines."],
    summaryMessage: "Document formatting and mandatory sections validated successfully. You may proceed with submission.",
    evaluatedAt: new Date().toISOString(),
    fileMetadata: {
      filename: "ncatex_student_paper.pdf",
      fileType: "pdf" as const,
      fileSizeBytes: pdfBuffer.length,
    },
  };

  const { submitPaperHandler } = await import("../server/ai-validation-functions");

  const submissionResult = await submitPaperHandler({
    authorName: "Aarav Sharma",
    authorEmail: "aarav.sharma@ncatex.edu",
    department: "Dept of Telecommunications",
    track: "VLSI & Embedded Systems",
    paperTitle: "Energy-Efficient Neuromorphic Processing for 6G IoT Edge Systems",
    abstract:
      "This paper presents an energy-efficient neuromorphic accelerator architecture for ultra-low latency edge inferencing in 6G wireless Internet of Things networks. Evaluated on hardware emulation with significant speedup.",
    filename: "ncatex_student_paper.pdf",
    buffer: pdfBuffer,
    mimeType: "application/pdf",
    preValidatedResult: compliantResult,
  });

  console.log("Submission Pipeline Result:");
  console.log(
    JSON.stringify(
      {
        success: submissionResult.success,
        saved: submissionResult.saved,
        pdfUrl: submissionResult.pdfUrl,
        storagePath: submissionResult.storagePath,
        paperId: submissionResult.paper.id,
        paperTitle: submissionResult.paper.paper_title,
        paperStatus: submissionResult.paper.status,
        pdfUrlInPaperRecord: submissionResult.paper.pdf_url || submissionResult.paper.file_url,
      },
      null,
      2,
    ),
  );

  let testPaperId: string | null = submissionResult.paper.id;
  let testStoragePath: string | null = submissionResult.storagePath;

  // Verify persistent DB record in Supabase
  const { data: dbPaper, error: dbErr } = await supabase
    .from("papers")
    .select("*")
    .eq("id", testPaperId)
    .single();

  if (dbErr) {
    console.error("Verification query error on papers table:", dbErr);
  } else {
    console.log("\nDatabase Record Verification Succeeded:");
    console.log("  ID:           ", dbPaper?.id);
    console.log("  Title:        ", dbPaper?.paper_title);
    console.log("  Author:       ", dbPaper?.author_name);
    console.log("  PDF / File URL: ", dbPaper?.file_url);
    console.log("  Abstract Preview: ", dbPaper?.abstract?.slice(0, 150) + "...");
  }

  // TEST 2: Incomplete PDF rejecting without saving to storage (HTTP 422 -> saved: false)
  console.log("\n--- TEST 2: Incomplete Manuscript Upload (Format Failure -> fileSaved: false) ---");
  const badPdf = "%PDF-1.4\nCorrupted or incomplete draft\n%%EOF";
  const badFormData = new FormData();
  badFormData.append("file", new Blob([Buffer.from(badPdf)], { type: "application/pdf" }), "incomplete_draft.pdf");

  const badReq = new Request("http://localhost:3000/api/student/validate-document", {
    method: "POST",
    body: badFormData,
  });

  const badRes = await handleAiValidationRequest(badReq);
  console.log("HTTP Status Code:", badRes?.status);
  const badJson = (await badRes?.json()) as {
    success: boolean;
    saved: boolean;
    status: string;
    result?: {
      summaryMessage: string;
      studentActionableFeedback?: string[];
    };
  };

  console.log("Rejection Result:", JSON.stringify({
    success: badJson?.success,
    saved: badJson?.saved,
    status: badJson?.status,
    summaryMessage: badJson?.result?.summaryMessage,
    actionableFeedbackCount: badJson?.result?.studentActionableFeedback?.length,
  }, null, 2));

  // TEST 3: Robust Error Handling (Empty file -> 400 Bad Request)
  console.log("\n--- TEST 3: Robust Error Handling on Invalid Input ---");
  const emptyFormData = new FormData();
  emptyFormData.append("file", new Blob([Buffer.from("")], { type: "application/pdf" }), "empty.pdf");

  const emptyReq = new Request("http://localhost:3000/api/student/submit-paper", {
    method: "POST",
    body: emptyFormData,
  });

  const emptyRes = await handleAiValidationRequest(emptyReq);
  console.log("Empty File HTTP Status Code:", emptyRes?.status);
  const emptyJson = await emptyRes?.json();
  console.log("Empty File Handled Error:", emptyJson);

  // TEST 4: Admin Review & Triage Endpoint
  console.log("\n--- TEST 4: Admin Review & Triage Live Execution ---");
  const triageReq = new Request("http://localhost:3000/api/admin/triage-submission", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paperTitle: "Hardware Accelerator for Spiking Neural Networks on 28nm FPGA",
      authorName: "Aarav Sharma",
      department: "VLSI Design & Electronics",
      track: "VLSI & Embedded Systems",
      abstract:
        "This paper presents a dedicated hardware accelerator designed on a 28nm FPGA for spiking neural networks. We propose an asynchronous event router that achieves a 4.2x reduction in dynamic power dissipation compared to synchronous baselines, operating at 250 MHz.",
      fullText:
        "Section 1: Introduction and motivation for ultra-low power edge computing. Section 2: Mathematical formulation of the leaky integrate-and-fire model. Section 3: Hardware pipeline architecture and memory partitioning. Section 4: Experimental synthesis on Xilinx Artix-7 and timing closure at 250MHz. Section 5: Conclusion.",
    }),
  });

  const triageRes = await handleAiValidationRequest(triageReq);
  console.log("HTTP Status Code:", triageRes?.status);
  const triageJson = (await triageRes?.json()) as {
    success: boolean;
    condition: string;
    recommendedAction: string;
    result?: {
      executiveSummary: string;
      scores: unknown;
    };
  };

  console.log(
    "Triage Result:",
    JSON.stringify(
      {
        success: triageJson?.success,
        condition: triageJson?.condition,
        recommendedAction: triageJson?.recommendedAction,
        executiveSummary: triageJson?.result?.executiveSummary,
        scores: triageJson?.result?.scores,
      },
      null,
      2,
    ),
  );

  // Clean up any test row created during verification
  if (testPaperId) {
    await supabase.from("papers").delete().eq("id", testPaperId);
    console.log("\nCleaned up verification test paper record from database.");
  }
  if (testStoragePath) {
    await supabase.storage.from("paper-drafts").remove([testStoragePath]);
    console.log("Cleaned up verification test file from 'paper-drafts' storage bucket.");
  }

  console.log("================================================================");
}

runVerification().catch(console.error);

