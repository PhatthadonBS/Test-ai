import { Readable } from 'stream';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const PDFParser = require('pdf2json');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const csvParser = require('csv-parser');

export const parsePDF = async (buffer) => {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);
        
        pdfParser.on("pdfParser_dataError", errData => {
            reject(new Error(errData.parserError));
        });
        
        pdfParser.on("pdfParser_dataReady", pdfData => {
            resolve(pdfParser.getRawTextContent());
        });
        
        pdfParser.parseBuffer(buffer);
    });
};

export const parseWord = async (buffer) => {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } catch (error) {
        throw new Error('Failed to parse Word document: ' + error.message);
    }
};

export const parseExcel = async (buffer) => {
    try {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        let text = '';
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            text += xlsx.utils.sheet_to_csv(worksheet) + '\n';
        });
        return text;
    } catch (error) {
        throw new Error('Failed to parse Excel document: ' + error.message);
    }
};

export const parseCSV = (buffer) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const stream = Readable.from(buffer);
        stream
            .pipe(csvParser())
            .on('data', (data) => results.push(JSON.stringify(data)))
            .on('end', () => resolve(results.join('\n')))
            .on('error', (error) => reject(new Error('Failed to parse CSV: ' + error.message)));
    });
};
