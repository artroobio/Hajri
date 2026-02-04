import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Set worker source for PDF.js (Using CDN for simplicity in Vite without complex config)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export async function extractTextFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n`;
    }
    return fullText;
}

export async function extractTextFromDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

export async function extractTextFromExcel(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer);
    let fullText = '';

    wb.SheetNames.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        // Convert to CSV for structure
        const csv = XLSX.utils.sheet_to_csv(ws);
        fullText += `--- Sheet: ${sheetName} ---\n${csv}\n`;
    });

    return fullText;
}
