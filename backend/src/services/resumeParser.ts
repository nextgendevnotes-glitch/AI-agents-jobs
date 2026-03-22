// @ts-ignore
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
// @ts-ignore
const pdf = require('pdf-parse');

export class ResumeParser {
  static async extractText(buffer: Buffer, mimetype: string): Promise<string> {
    try {
      if (mimetype === 'application/pdf') {
        const data = await pdf(buffer);
        let extractedText = data.text || '';
        
        // OCR Fallback for Image-based (scanned) PDFs if initial text is empty
        if (extractedText.trim().length < 50) {
          const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
          extractedText = text;
        }
        
        return extractedText;
      } else if (
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        mimetype === 'application/msword'
      ) {
        const data = await mammoth.extractRawText({ buffer });
        return data.value;
      } else if (mimetype.startsWith('image/')) {
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
        if (!text) throw new Error('OCR failed to extract text from image');
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
