import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
    selector: 'app-status-info',
    imports: [CommonModule],
    templateUrl: './form-status-info.component.html',
    styleUrls: ['./form-status-info.component.css']
})
export class FormStatusInfoComponent {
  @Input() status: string = ''; // menerima status sebagai input
}
