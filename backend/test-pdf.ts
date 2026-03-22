import pdfParse from 'pdf-parse';
console.log('Type of pdfParse:', typeof pdfParse);
console.log('Keys of pdfParse:', Object.keys(pdfParse));
if ((pdfParse as any).default) {
  console.log('Type of pdfParse.default:', typeof (pdfParse as any).default);
}
