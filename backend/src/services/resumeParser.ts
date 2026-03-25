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
        
        // Tesseract.js cannot directly read PDF files. If the text is empty, it's likely a scanned PDF.
        if (extractedText.trim().length < 50) {
          throw new Error('This PDF appears to be a scanned image with no readable text. Please upload a standard PDF, a Word document, or an Image (PNG/JPG).');
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
