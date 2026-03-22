import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

export class ResumeParser {
  static async extractText(buffer: Buffer, mimetype: string): Promise<string> {
    try {
      if (mimetype === 'application/pdf') {
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        let extractedText = data.text || '';
        
        // OCR Fallback for Image-based (scanned) PDFs heavily missing a text-layer
        if (extractedText.trim().length < 20) {
           const shots = await parser.getScreenshot({ scale: 1.5 });
           if (shots && shots.pages && shots.pages.length > 0) {
             const ocrPromises = shots.pages.map(p => Tesseract.recognize(p.data, 'eng').then(res => res.data.text));
             const textArray = await Promise.all(ocrPromises);
             extractedText = textArray.join('\n');
           }
        }
        
        await parser.destroy();
        return extractedText;
      } else if (
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        mimetype === 'application/msword'
      ) {
        const data = await mammoth.extractRawText({ buffer });
        return data.value;
      } else if (mimetype.startsWith('image/')) {
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
        return text;
      } else {
         throw new Error('Unsupported file type.');
      }
    } catch (error) {
      console.error('Error parsing resume:', error);
      throw new Error(`Failed to extract text: ${(error as any).message}`);
    }
  }
}
