import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {
  uploading = false;
  message = '';
  isSuccess = false;

  constructor(private apiService: ApiService) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploading = true;
      this.message = 'Uploading and analyzing document...';
      this.isSuccess = false;
      
      this.apiService.uploadFile(file).subscribe({
        next: (res) => {
          this.uploading = false;
          this.isSuccess = true;
          this.message = 'Document added to AI Knowledge Base!';
          setTimeout(() => this.message = '', 4000);
        },
        error: (err) => {
          this.uploading = false;
          this.isSuccess = false;
          this.message = 'Upload failed. Please try again.';
          setTimeout(() => this.message = '', 4000);
        }
      });
    }
  }
}
