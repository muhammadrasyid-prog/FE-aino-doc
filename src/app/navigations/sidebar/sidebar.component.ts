import { Component, Inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { CommonModule } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
import axios from 'axios';

@Component({
  standalone: true,
    selector: 'app-sidebar',
    imports: [
        CommonModule,
        RouterOutlet,
        RouterLink,
        RouterLinkActive,
        HeaderComponent,
    ],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  role_code = '';
  division_code = '';

  private apiUrl: string;

  constructor(
    private cookieService: CookieService,
    @Inject('apiUrl') apiUrl: string
  ) {
    this.apiUrl = apiUrl;
  }

  ngOnInit() {
    this.fetchProfileData();
  }

  fetchProfileData(): void {
    const token = this.cookieService.get('userToken');

    axios
      .get(`${this.apiUrl}/auth/my/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        this.division_code = response.data.division_code;
        this.role_code = response.data.role_code;
      })
      .catch((error) => {
        console.log(error);
      });
  }
}
