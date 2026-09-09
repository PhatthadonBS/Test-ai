import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 เริ่มทำการ Seed ข้อมูล...');
    const dataPath = './prisma/data/medical_knowledge.txt';

    if (!fs.existsSync(dataPath)) {
        console.error('❌ ไม่พบไฟล์ข้อมูลที่: ' + dataPath);
        return;
    }

    const fileContent = fs.readFileSync(dataPath, 'utf-8');

    // 1. ลบข้อมูลเดิมทิ้งก่อน (ถ้าต้องการเริ่มใหม่หมด)
    await prisma.knowledgeDocument.deleteMany();
    console.log('🗑️ ลบข้อมูลเดิมออกแล้ว');

    // 2. นำเข้าข้อมูลใหม่
    await prisma.knowledgeDocument.create({
        data: {
            fileName: 'medical_knowledge_seed.txt',
            fileType: 'txt',
            content: fileContent
        }
    });

    console.log('✅ นำเข้าข้อมูลมาตรฐานสำเร็จแล้ว!');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
