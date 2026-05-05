"use client";

/**
 * Browser-side PDF text extraction powered by pdfjs-dist.
 *
 * The pdfjs worker is loaded from the same package via `new URL(..., import.meta.url)`
 * so bundlers emit it as a static asset. The parser keeps PDF coordinates so Chinese
 * resumes with multi-column or mixed font output can be reconstructed by line.
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

/**
 * Resolve pdfjs worker URL.
 *
 * In production (EdgeOne etc.), `import.meta.url`-based resolution may produce
 * hashed paths that the platform doesn't serve correctly. We prefer the public/
 * copy placed by the `postbuild` script; in dev the bundler-based URL works.
 */
function getWorkerSrc(): string {
  // Always prefer public/ copy (committed to repo, always available).
  // Falls back to bundled URL in dev if public/ copy is missing.
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "/pdf.worker.min.mjs";
  }
  try {
    return new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  } catch {
    return "/pdf.worker.min.mjs";
  }
}

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

function shouldGlueText(left: string, right: string): boolean {
  if (!left || !right) return false;
  const a = left[left.length - 1];
  const b = right[0];
  if (/[\u4e00-\u9fff]/.test(a) && /[\u4e00-\u9fff]/.test(b)) return true;
  if (/\d/.test(a) && /[\d.年月]/.test(b)) return true;
  if (/[./年月]/.test(a) && /\d/.test(b)) return true;
  return false;
}

function joinLineText(chunks: TextChunk[]): string {
  return chunks
    .sort((a, b) => a.x - b.x)
    .reduce((line, chunk) => {
      const text = chunk.text.trim();
      if (!text) return line;
      if (!line) return text;
      return shouldGlueText(line, text) ? `${line}${text}` : `${line} ${text}`;
    }, "")
    .replace(/[ \t]+/g, " ")
    .trim();
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
    const line = joinLineText(currentLine);
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
    if (chunk.hasEOL) flushLine();
  }
  flushLine();

  return lines.join("\n");
}

async function ensureWorker(): Promise<void> {
  if (workerInitialized) return;
  try {
    const pdfjs = await import("pdfjs-dist");
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = getWorkerSrc();
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
  if (file.type && file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
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
  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const content = await page.getTextContent();
    const text = joinChunksByLines(extractTextChunks(content.items));
    pageTexts.push(text);
  }

  const fullText = pageTexts.join("\n").replace(/[ \t]+/g, " ").trim();

  if (fullText.length < 20) {
    throw new ParseError(
      "EMPTY_TEXT",
      "未能从 PDF 中提取到足够文本，可能是扫描件或图片型 PDF。",
    );
  }

  return fullText;
}
