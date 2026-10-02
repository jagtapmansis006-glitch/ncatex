export interface PdfExtractedContent {
  base64Data: string;
  mimeType: "application/pdf";
  estimatedPageCount: number | null;
  extractedSnippet: string;
}

/**
 * Prepares PDF buffer for Gemini multimodal processing and extracts lightweight text and metadata.
 */
export function extractPdfContent(buffer: Buffer | Uint8Array): PdfExtractedContent {
  const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const base64Data = nodeBuffer.toString("base64");

  // Attempt to estimate page count from PDF object markers (/Type /Page or /Count N)
  let estimatedPageCount: number | null = null;
  const pdfString = nodeBuffer.toString("latin1");

  const pageMatches = pdfString.match(/\/Type\s*\/Page\b/g);
  if (pageMatches && pageMatches.length > 0) {
    estimatedPageCount = pageMatches.length;
  } else {
    const countMatch = pdfString.match(/\/Count\s+(\d+)/);
    if (countMatch && countMatch[1]) {
      estimatedPageCount = parseInt(countMatch[1], 10);
    }
  }

  // Extract text snippets from PDF streams and literal strings: (Text) Tj, [(Text)] TJ, or BT ... ET blocks
  const textTokens: string[] = [];

  // Match text blocks between BT and ET
  const streamRegex = /BT\s*([\s\S]*?)\s*ET/g;
  let match: RegExpExecArray | null;
  while ((match = streamRegex.exec(pdfString)) !== null) {
    const rawStream = match[1] ?? "";
    const clean = rawStream.replace(/[^\x20-\x7E\n]/g, " ").trim();
    if (clean.length > 0) {
      textTokens.push(clean);
    }
  }

  // Match literal string operators: (Text) Tj or (Text)' or \((.*?)\)
  const literalStringRegex = /\(([^)]+)\)\s*(?:Tj|TJ|'|")/g;
  while ((match = literalStringRegex.exec(pdfString)) !== null) {
    if (match[1] && match[1].trim().length > 0) {
      textTokens.push(match[1].trim());
    }
  }

  // Fallback: If no BT/ET blocks, scan for common readable ASCII sequences
  if (textTokens.length === 0) {
    const readableRegex = /[A-Za-z0-9][A-Za-z0-9\s,.:;_\-/'"()]{15,}/g;
    while ((match = readableRegex.exec(pdfString)) !== null && textTokens.length < 50) {
      const token = match[0].trim();
      if (!token.includes("obj") && !token.includes("endobj") && !token.includes("trailer")) {
        textTokens.push(token);
      }
    }
  }

  const extractedSnippet = textTokens.join(" \n ").slice(0, 5000);

  return {
    base64Data,
    mimeType: "application/pdf",
    estimatedPageCount,
    extractedSnippet,
  };
}
