import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-workbench',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workbench.component.html',
  styleUrls: ['./workbench.component.css']
})
export class WorkbenchComponent {
  patient = {
    name: '',
    weight: null,
    height: null,
    temperature: null,
    allergies: '',
    smoking: 'ไม่สูบ',
    alcohol: 'ไม่ดื่ม',
    symptoms: ''
  };

  aiResponse: string = '';
  loading: boolean = false;
  showModal: boolean = false;

  constructor(private apiService: ApiService) {}

  analyzePatient() {
    if (!this.patient.symptoms.trim()) {
      alert('กรุณาระบุอาการป่วย (Symptoms)');
      return;
    }
    
    this.loading = true;
    this.showModal = true;
    this.aiResponse = '';

    this.apiService.analyze(this.patient).subscribe({
      next: (res) => {
        this.aiResponse = res.analysis;
        this.loading = false;
      },
      error: (err) => {
        this.aiResponse = 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI หรือ API: ' + err.message;
        this.loading = false;
      }
    });
  }

  closeModal() {
    this.showModal = false;
  }
}
