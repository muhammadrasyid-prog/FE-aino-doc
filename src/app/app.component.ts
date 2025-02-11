import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './navigations/sidebar/sidebar.component';
import { HeaderComponent } from './navigations/header/header.component';

@Component({
  standalone: true,
    selector: 'app-root',
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, SidebarComponent, HeaderComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'routing';
}
