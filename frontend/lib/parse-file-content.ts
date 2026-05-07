export interface ParsedFileContent {
  text: string;
  sourceType: "txt" | "docx" | "pdf" | "unknown";
  warning?: string;
}

/**
 * Parse a .txt file by reading it as plain text.
 */
async function parseTxt(file: File): Promise<ParsedFileContent> {
  const text = await file.text();
  if (!text.trim()) {
    return { text: "", sourceType: "txt", warning: "文件内容为空" };
  }
  return { text, sourceType: "txt" };
}

/**
 * Parse a .docx file using mammoth (browser-side, no server required).
 */
async function parseDocx(file: File): Promise<ParsedFileContent> {
  const mammoth = await import("mammoth");

  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = (result.value ?? "").trim();
  const messages = (result.messages ?? [])
    .filter((m) => m.type === "warning")
    .map((m) => m.message);

  return {
    text,
    sourceType: "docx",
    warning: messages.length > 0 ? messages.slice(0, 2).join("; ") : undefined,
  };
}

/**
 * Parse a .pdf file using pdfjs-dist (browser-side, no server required).
 * Returns concatenated text from all pages.
 */
async function parsePdf(file: File): Promise<ParsedFileContent> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");

  // Use the CDN worker for pdf.js
  GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;

  const pages: string[] = [];
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => {
        if ("str" in item) {
          return item.str;
        }
        return "";
      })
      .join(" ");
    pages.push(pageText);
  }

  const text = pages.join("\n").trim();
  return {
    text,
    sourceType: "pdf",
    warning: !text ? "PDF 解析后无文本内容，可能是扫描件或图片 PDF" : undefined,
  };
}

/**
 * Auto-detect file type and extract text content.
 * Supports .txt, .docx, and .pdf files.
 */
export async function parseFileContent(file: File): Promise<ParsedFileContent> {
  const name = file.name.toLowerCase();

  try {
    if (name.endsWith(".txt")) {
      return parseTxt(file);
    }
    if (name.endsWith(".docx")) {
      return parseDocx(file);
    }
    if (name.endsWith(".pdf")) {
      return parsePdf(file);
    }
    // Fallback: try as text
    return parseTxt(file);
  } catch (err) {
    const message = err instanceof Error ? err.message : "文件解析失败";
    return {
      text: "",
      sourceType: "unknown",
      warning: `解析失败：${message}`,
    };
  }
}
