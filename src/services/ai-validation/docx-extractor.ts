import mammoth from "mammoth";

export interface DocxExtractedContent {
  rawText: string;
  markdown: string;
  wordCount: number;
  headings: string[];
  detectedSections: string[];
}

interface ExtendedMammoth {
  convertToMarkdown?: (input: { buffer: Buffer }) => Promise<{ value: string }>;
  convertToHtml: (input: { buffer: Buffer }) => Promise<{ value: string }>;
  extractRawText: (input: { buffer: Buffer }) => Promise<{ value: string }>;
}

/**
 * Extracts and converts contents of a DOCX file using mammoth.
 * Returns raw text, markdown/html representation, detected headings, and metrics.
 */
export async function extractDocxContent(
  buffer: Buffer | Uint8Array,
): Promise<DocxExtractedContent> {
  const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const extendedMammoth = mammoth as unknown as ExtendedMammoth;

  // Extract raw text for semantic analysis
  const rawTextResult = await extendedMammoth.extractRawText({ buffer: nodeBuffer });
  const rawText = rawTextResult.value ?? "";

  // Convert to Markdown or HTML to preserve document layout, headings, and lists
  let markdown = "";
  if (typeof extendedMammoth.convertToMarkdown === "function") {
    const mdResult = await extendedMammoth.convertToMarkdown({ buffer: nodeBuffer });
    markdown = mdResult.value ?? "";
  } else {
    const htmlResult = await extendedMammoth.convertToHtml({ buffer: nodeBuffer });
    markdown = htmlResult.value ?? "";
  }

  // Count words
  const words = rawText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const wordCount = words.length;

  // Extract headings from markdown (# Header, ## Header, etc.) or HTML (<h1>, <h2>)
  const headings: string[] = [];
  const headingMdRegex = /^#{1,4}\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = headingMdRegex.exec(markdown)) !== null) {
    if (match[1]) {
      headings.push(match[1].trim());
    }
  }

  const headingHtmlRegex = /<h[1-4][^>]*>(.*?)<\/h[1-4]>/gi;
  while ((match = headingHtmlRegex.exec(markdown)) !== null) {
    if (match[1]) {
      const clean = match[1].replace(/<[^>]+>/g, "").trim();
      if (clean) headings.push(clean);
    }
  }

  // Detect canonical academic sections
  const canonicalSections = [
    "Abstract",
    "Keywords",
    "Index Terms",
    "Introduction",
    "Related Work",
    "Literature Survey",
    "Methodology",
    "System Model",
    "Proposed Architecture",
    "Experiment",
    "Results",
    "Discussion",
    "Conclusion",
    "Future Work",
    "References",
    "Acknowledgment",
  ];

  const detectedSections = canonicalSections.filter((sec) => {
    const pattern = new RegExp(`\\b${sec}\\b`, "i");
    return pattern.test(markdown) || pattern.test(rawText);
  });

  return {
    rawText,
    markdown,
    wordCount,
    headings,
    detectedSections,
  };
}
