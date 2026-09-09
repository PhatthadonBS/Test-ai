import { Component } from '@angular/core';
import { WorkbenchComponent } from './components/workbench/workbench.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [WorkbenchComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'AI Medical Assistant';
}
