import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
// @ts-ignore
import PDFParser from 'pdf2json';

export class DocumentProcessor {
  private splitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }

  async processPdf(buffer: Buffer): Promise<string[]> {
    try {
      const text = await this.extractText(buffer);
      
      // Basic cleaning
      const cleanText = text
        .replace(/\n+/g, '\n') // Replace multiple newlines with single
        .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable chars (keep newlines)
        .trim();

      if (!cleanText) {
        throw new Error('No text content extracted from PDF');
      }

      return await this.splitter.splitText(cleanText);
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error; // Re-throw to be caught by Orchestrator
    }
  }

  private extractText(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1 as any);

      pdfParser.on("pdfParser_dataError", (errData: any) => {
         reject(errData.parserError);
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
         // getRawTextContent() returns text. 
         // But wait, usually we access pdfData.formImage.Pages...
         // Let's check the best way to get simple text.
         // pdfParser.getRawTextContent() is available in newer versions.
         try {
             const text = pdfParser.getRawTextContent();
             resolve(text);
         } catch (e) {
             reject(e);
         }
      });

      pdfParser.parseBuffer(buffer);
    });
  }
}