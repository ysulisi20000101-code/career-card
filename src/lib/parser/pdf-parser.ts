"use client";

/**
 * Browser-side PDF text extraction powered by pdfjs-dist.
 *
 * The pdfjs worker is loaded from the same package via `new URL(..., import.meta.url)`
 * so that bundlers (Webpack/Turbopack) emit it as a static asset.
 *
 * Throws ParseError with a clear message when the PDF cannot be read.
 */

export class ParseError extends Error {
  readonly code: "INVALID_PDF" | "EMPTY_TEXT" | "WORKER_INIT" | "UNKNOWN";
  constructor(code: ParseError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "ParseError";
  }
}

let workerInitialized = false;

interface TextChunk {
  text: string;
  x: number;
  y: number;
  hasEOL: boolean;
}

function extractTextChunks(items: unknown[]): TextChunk[] {
  return items
    .map((item) => {
      if (!item || typeof item !== "object" || !("str" in item)) return null;
      const record = item as { str?: unknown; transform?: unknown; hasEOL?: unknown };
      const raw = typeof record.str === "string" ? record.str : "";
      const transform = Array.isArray(record.transform) ? record.transform : [];
      const x = typeof transform[4] === "number" ? transform[4] : 0;
      const y = typeof transform[5] === "number" ? transform[5] : 0;
      return {
        text: raw,
        x,
        y,
        hasEOL: Boolean(record.hasEOL),
      };
    })
    .filter((chunk): chunk is TextChunk => Boolean(chunk && chunk.text.trim()));
}

function joinChunksByLines(chunks: TextChunk[]): string {
  if (chunks.length === 0) return "";
  const sorted = [...chunks].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 1.5) return b.y - a.y;
    return a.x - b.x;
  });

  const lines: string[] = [];
  let currentLine: TextChunk[] = [];
  let currentY = sorted[0].y;

  const flushLine = () => {
    if (currentLine.length === 0) return;
    const line = currentLine
      .sort((a, b) => a.x - b.x)
      .map((chunk) => chunk.text.trim())
      .join(" ")
      .replace(/[ \t]+/g, " ")
      .trim();
    if (line) lines.push(line);
    currentLine = [];
  };

  for (const chunk of sorted) {
    const isNewLine = Math.abs(chunk.y - currentY) > 1.5;
    if (isNewLine) {
      flushLine();
      currentY = chunk.y;
    }
    currentLine.push(chunk);
    if (chunk.hasEOL) {
      flushLine();
    }
  }
  flushLine();

  return lines.join("\n");
}

async function ensureWorker(): Promise<void> {
  if (workerInitialized) return;
  try {
    const pdfjs = await import("pdfjs-dist");
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      // Resolve the worker URL relative to the pdfjs-dist ESM entry so
      // bundlers (Webpack/Turbopack) emit it as a static asset.
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
    }
    workerInitialized = true;
  } catch (err) {
    throw new ParseError(
      "WORKER_INIT",
      `PDF 解析引擎初始化失败：${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export async function extractPdfText(file: File): Promise<string> {
  if (file.type && file.type !== "application/pdf") {
    throw new ParseError("INVALID_PDF", "仅支持 PDF 格式文件");
  }

  await ensureWorker();
  const pdfjs = await import("pdfjs-dist");

  const arrayBuffer = await file.arrayBuffer();

  let pdf;
  try {
    pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  } catch (err) {
    throw new ParseError(
      "INVALID_PDF",
      `无法解析该 PDF 文件：${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const pageTexts: string[] = [];
  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex++) {
    const page = await pdf.getPage(pageIndex);
    const content = await page.getTextContent();
    const text = joinChunksByLines(extractTextChunks(content.items));
    pageTexts.push(text);
  }

  const fullText = pageTexts.join("\n").replace(/[ \t]+/g, " ").trim();

  if (fullText.length < 20) {
    throw new ParseError(
      "EMPTY_TEXT",
      "未能从 PDF 中提取到足够文本（可能是扫描件/图片型 PDF）",
    );
  }

  return fullText;
}
