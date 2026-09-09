import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const docs = await prisma.knowledgeDocument.findMany();
    fs.mkdirSync('./prisma/data', { recursive: true });
    
    // Save existing DB data to a text file
    if (docs.length > 0) {
        fs.writeFileSync('./prisma/data/medical_knowledge.txt', docs.map(d => d.content).join('\n\n'));
        console.log('✅ กู้คืนข้อมูลเดิมจาก Database มาเก็บไว้ที่ prisma/data/medical_knowledge.txt สำเร็จ (' + docs.length + ' ไฟล์)');
    } else {
        console.log('⚠️ ไม่มีข้อมูลใน Database ให้กู้คืน');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
