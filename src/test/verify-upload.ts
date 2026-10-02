import { handleAiValidationRequest } from "../server/ai-validation-middleware";
import { GEMINI_MODEL } from "../services/ai-validation/gemini-client";

async function runVerification() {
  console.log("================================================================");
  console.log("       LIVE API VERIFICATION & DOCUMENT UPLOAD PIPELINE        ");
  console.log("================================================================");
  console.log("Active Gemini Model:     ", GEMINI_MODEL);
  console.log("GEMINI_API_KEY Configured: ", Boolean(process.env["GEMINI_API_KEY"]));

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

  // TEST 1: Multipart/form-data upload test
  console.log("\n--- TEST 1: Multipart/form-data Document Upload ---");
  const formData = new FormData();
  const fileBlob = new Blob([pdfBuffer], { type: "application/pdf" });
  formData.append("file", fileBlob, "ncatex_student_paper.pdf");

  const uploadReq = new Request("http://localhost:3000/api/student/validate-document", {
    method: "POST",
    body: formData,
  });

  const uploadRes = await handleAiValidationRequest(uploadReq);
  console.log("HTTP Status Code:", uploadRes?.status);
  const uploadJson = (await uploadRes?.json()) as {
    success: boolean;
    saved: boolean;
    status: string;
    result?: {
      overallScore: number;
      canSubmit: boolean;
      summaryMessage: string;
      fileMetadata: unknown;
      mandatorySections?: Array<{ sectionName: string; status: string }>;
    };
  };

  console.log("Upload Result:");
  console.log(
    JSON.stringify(
      {
        success: uploadJson?.success,
        saved: uploadJson?.saved,
        status: uploadJson?.status,
        overallScore: uploadJson?.result?.overallScore,
        canSubmit: uploadJson?.result?.canSubmit,
        sectionsCount: uploadJson?.result?.mandatorySections?.length,
        summaryMessage: uploadJson?.result?.summaryMessage,
        fileMetadata: uploadJson?.result?.fileMetadata,
      },
      null,
      2,
    ),
  );

  // TEST 2: Incomplete PDF rejecting without saving (HTTP 422)
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

  console.log("Rejection Result:");
  console.log(
    JSON.stringify(
      {
        success: badJson?.success,
        saved: badJson?.saved,
        status: badJson?.status,
        summaryMessage: badJson?.result?.summaryMessage,
        actionableFeedbackCount: badJson?.result?.studentActionableFeedback?.length,
        firstFeedbackItem: badJson?.result?.studentActionableFeedback?.[0],
      },
      null,
      2,
    ),
  );

  // TEST 3: Admin Review & Triage Endpoint
  console.log("\n--- TEST 3: Admin Review & Triage Live Execution ---");
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

  console.log("Triage Result:");
  console.log(
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

  console.log("================================================================");
}

runVerification().catch(console.error);
