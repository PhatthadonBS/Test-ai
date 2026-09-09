import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { parsePDF, parseWord, parseExcel, parseCSV } from './utils/fileParser.js';
import path from 'path';
const app = express();
app.use(cors());
app.use(express.json());

// ตั้งค่า Google GenAI SDK อย่างเป็นทางการ
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

app.get('/api/documents', async (req, res) => {
    try {
        const docs = await prisma.knowledgeDocument.findMany({
            select: { id: true, fileName: true, fileType: true, createdAt: true }
        });
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch documents" });
    }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { originalname, buffer } = req.file;
        const ext = path.extname(originalname).toLowerCase();
        let extractedText = '';

        if (ext === '.pdf') {
            extractedText = await parsePDF(buffer);
        } else if (ext === '.docx') {
            extractedText = await parseWord(buffer);
        } else if (ext === '.xlsx' || ext === '.xls') {
            extractedText = await parseExcel(buffer);
        } else if (ext === '.csv') {
            extractedText = await parseCSV(buffer);
        } else {
            return res.status(400).json({ error: 'Unsupported file type' });
        }

        const document = await prisma.knowledgeDocument.create({
            data: {
                fileName: originalname,
                fileType: ext.replace('.', ''),
                content: extractedText
            }
        });

        res.json({ success: true, documentId: document.id, message: 'File processed and saved' });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Failed to process file', details: error.message });
    }
});
app.post('/api/analyze', async (req, res) => {
    try {
        const { name, weight, height, temperature, allergies, smoking, alcohol, symptoms } = req.body;
        
        if (!symptoms) {
            return res.status(400).json({ error: "กรุณาระบุอาการของผู้ป่วย" });
        }

        console.log(`📥 ได้รับข้อมูลคนไข้: ${name || 'ไม่ระบุ'} | นน: ${weight||'-'} | สส: ${height||'-'} | อุณหภูมิ: ${temperature||'-'} | สูบ: ${smoking} | ดื่ม: ${alcohol}`);
        console.log(`🩺 อาการ: ${symptoms} | แพ้ยา: ${allergies || 'ไม่มี'}`);

        // ดึงข้อมูลจาก Database
        const docs = await prisma.knowledgeDocument.findMany();
        let knowledgeBase = docs.map(d => `[${d.fileName}] ${d.content}`).join('\n\n');
        
        if (!knowledgeBase) {
            knowledgeBase = "ไม่มีข้อมูลอ้างอิงทางการแพทย์ในระบบ";
        }

        // ประกอบ Prompt
        const prompt = `
        คุณคือแพทย์และผู้เชี่ยวชาญด้านสมุนไพรไทย จงประเมินอาการและแนะนำสมุนไพร/การรักษา โดยอิงจาก "ข้อมูลอ้างอิงทางการแพทย์" ด้านล่างนี้เป็นหลัก
        เนื่องจากข้อมูลอ้างอิงอาจใช้คำศัพท์แพทย์แผนไทย (เช่น ลม, เสมหะ, กำเดา, ธาตุ) โปรดพยายามเทียบเคียงอาการปัจจุบันของคนไข้ (เช่น ปวดหัว, มีไข้, ท้องเสีย) กับสรรพคุณในเอกสารให้ดีที่สุด
        
        ข้อบังคับสำคัญ: คุณต้องตอบกลับเป็นข้อมูลรูปแบบ JSON เท่านั้น โดยมีโครงสร้างดังนี้:
        {
          "summary": "สรุปอาการป่วยเบื้องต้น",
          "recommendation": "ยา/สมุนไพรที่แนะนำตัวที่ดีที่สุด (อิงจากเอกสาร)",
          "usage": "ข้อมูลการใช้/วิธีรับประทาน",
          "precautions": "ข้อควรระวัง/ผลข้างเคียง",
          "self_care": "ข้อแนะนำการดูแลตัวเองเพิ่มเติม"
        }
        หากไม่พบสมุนไพรที่เกี่ยวข้องเลยจริงๆ ให้ใส่ในฟิลด์ recommendation ว่า "ไม่พบข้อมูลสมุนไพรที่ตรงกับอาการ แนะนำให้พบแพทย์"

        --- ข้อมูลอ้างอิงทางการแพทย์ (สมุนไพร) ---
        ${knowledgeBase}

        --- ข้อมูลคนไข้ (Patient Profile) ---
        ชื่อ: ${name || 'ไม่ระบุ'}
        น้ำหนัก: ${weight ? weight + ' kg' : 'ไม่ระบุ'}
        ส่วนสูง: ${height ? height + ' cm' : 'ไม่ระบุ'}
        อุณหภูมิร่างกาย: ${temperature ? temperature + ' °C' : 'ไม่ระบุ'}
        ประวัติแพ้ยา: ${allergies || 'ไม่มี'} 
        ประวัติการสูบบุหรี่: ${smoking || 'ไม่ระบุ'}
        ประวัติการดื่มสุรา: ${alcohol || 'ไม่ระบุ'}
        
        อาการที่พบ (Chief Complaint): ${symptoms}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        });

        // แปลงข้อความ JSON ที่ได้จาก AI เป็น Object 
        let aiResult = {};
        try {
            aiResult = JSON.parse(response.text);
        } catch (e) {
            console.error("Failed to parse JSON:", response.text);
            aiResult = {
                summary: "เกิดข้อผิดพลาดในการอ่านผลลัพธ์",
                recommendation: "-",
                usage: "-",
                precautions: "-",
                self_care: "-"
            };
        }

        res.json({
            success: true,
            analysis: aiResult,
            sources_used: "Direct Knowledge Base Match"
        });

    } catch (error) {
        console.error("เกิดข้อผิดพลาด:", error);
        res.status(500).json({ error: "ระบบประมวลผลขัดข้อง", details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server รันแล้วที่ http://localhost:${PORT}`);
    console.log(`✅ พร้อมรับคำถามผ่าน API แล้ว!`);
});