import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('chatScroll') private chatScrollContainer!: ElementRef;
  
  messages: any[] = [
    { sender: 'ai', text: 'สวัสดีครับ ผมคือผู้ช่วยทางการแพทย์ AI 🩺\nมีอาการอย่างไร หรือมีประวัติแพ้ยาอะไร แจ้งผมได้เลยครับ' }
  ];
  symptoms = '';
  allergies = '';
  loading = false;

  constructor(private apiService: ApiService) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  sendMessage() {
    if (!this.symptoms.trim()) return;

    this.messages.push({ sender: 'user', text: `อาการ: ${this.symptoms}\nแพ้ยา: ${this.allergies || 'ไม่มี'}` });
    this.loading = true;

    this.apiService.analyze(this.symptoms, this.allergies).subscribe({
      next: (res) => {
        this.messages.push({ sender: 'ai', text: res.analysis });
        this.loading = false;
        this.symptoms = '';
        this.allergies = '';
      },
      error: (err) => {
        this.messages.push({ sender: 'ai', text: 'ขออภัยครับ ระบบประมวลผลมีปัญหา กรุณาลองใหม่อีกครั้ง' });
        this.loading = false;
      }
    });
  }
}
