export async function extractTextFromPdf(file: File): Promise<string> {
  // Dynamic import to avoid bundling pdfjs-dist in main chunk
  const pdfjsLib = await import('pdfjs-dist');

  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => {
        if ('str' in item) return item.str;
        return '';
      })
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n\n');
}
