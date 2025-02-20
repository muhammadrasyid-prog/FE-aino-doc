import { Component, OnInit, Inject } from '@angular/core';
import axios from 'axios';
import { environment } from '../../environments/environment';
import { CookieService } from 'ngx-cookie-service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
// import { TourGuideService } from '../services/shepherd/shepherd.service';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  constructor(
    private router: Router,
    private cookieService: CookieService,
    // private tourGuideService: TourGuideService,
    @Inject('apiUrl') private apiUrl: string
  ) {}

  user: any = {};
  role_code: any;
  // private tour: any;
  recentTimelineHistory: any[] = [];
  olderTimelineHistory: any[] = [];
  allOlderTimelineHistory: any[] = [];
  olderTimelineOffset: number = 0; // Offset untuk paginasi
  hasMoreData: boolean = true;

  isLoading: boolean = false;
  noMoreDataMessage: string | null = null;

  // user
  dataDALength: any;
  dataITCMLength: any;
  dataBALength: any;
  dataHALength: any;

  dataSignatureITCMLength: any;
  dataSignatureDALength: any;
  dataSignatureBALength: any;
  dataSignatureHALength: any;

  dataListAllFormDA: any[] = [];
  dataListFormITCM: any[] = [];
  dataListAllBA: any[] = [];
  dataListAllHA: any[] = [];

  dataListSignatureITCM: any[] = [];
  dataListSignatureDA: any[] = [];
  dataListSignatureBA: any[] = [];
  dataListSignatureHA: any[] = [];
  p: any;

  ngOnInit(): void {
    this.fetchProfileData();
    console.log('Role Code di ngOnInit:', this.role_code);
    // Auto refresh setiap 3 menit
    setInterval(() => {
      if (this.role_code === 'SA' || this.role_code === 'A') {
        this.fetchRecentTimeline();
        this.fetchOlderTimeline();
      }
    }, 180000);
    this.fetchDataFormDA();
    this.fetchDataFormITCM();
    this.fetchAllDataBA();
    this.fetchAllDataHA();

    this.fetchITCMSignature();
    this.fetchDASignature();
    this.fetchBASignature();
    this.fetchHASignature();
  }

  // startTour() {
  //   this.tourGuideService.startTour(); // Mulai tur saat tombol diklik
  // }

  fetchProfileData() {
    const token = this.cookieService.get('userToken');
    console.log('Token:', token);

    axios
      .get(`${this.apiUrl}/auth/my/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        console.log('Profile data:', response.data);

        if (response.data && response.data.role_code) {
          this.user = { role: response.data.role_code }; // Gunakan role_code
          this.role_code = response.data.role_code; // Tambahkan ini
          console.log('User:', this.user);
          console.log('User role:', this.user.role);

          // Cek role sebelum fetch timeline
          if (this.user.role === 'SA' || this.user.role === 'A') {
            this.fetchRecentTimeline();
            this.fetchOlderTimeline();
          } else {
            console.warn(
              'Role bukan SA atau A, fetchTimelineHistory tidak dijalankan.'
            );
          }
        } else {
          console.error('Role tidak ditemukan dalam response');
        }
      })
      .catch((error) => {
        console.error('Error fetching profile data:', error);
      });
  }

  fetchRecentTimeline() {
    if (!this.user || !this.user.role) {
      return;
    }

    const endpoint =
      this.user.role === 'SA'
        ? `${environment.apiUrl2}/superadmin/timeline/recent`
        : `${environment.apiUrl2}/admin/timeline/recent`;

    axios
      .get(endpoint, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        if (Array.isArray(response.data)) {
          this.recentTimelineHistory = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          this.recentTimelineHistory = response.data.data; // Kalau API pakai wrapper object
        } else {
          this.recentTimelineHistory = [];
        }
      })
      .catch((error) => {
        console.error('Error fetching timeline history:', error);
      });
  }

  // fetchOlderTimeline() {
  //   if (!this.user || !this.user.role) {
  //     console.log('fetching older tidak jalan');
  //     console.error('User atau role tidak terdefinisi');
  //     return;
  //   }

  //   const endpoint =
  //     this.user.role === 'SA'
  //       ? `${environment.apiUrl2}/superadmin/timeline/older`
  //       : `${environment.apiUrl2}/admin/timeline/older`;

  //   axios
  //     .get(endpoint, {
  //       headers: {
  //         Authorization: `Bearer ${this.cookieService.get('userToken')}`,
  //       },
  //     })
  //     .then((response) => {
  //       console.log('Older:', response.data); // Cek isi response
  //       if (Array.isArray(response.data)) {
  //         // Simpan semua data ke variabel
  //         this.allOlderTimelineHistory = response.data;
  //         // this.olderTimelineHistory = response.data;

  //         // Tampilkan hanya 3 data pertama
  //       this.olderTimelineHistory = this.allOlderTimelineHistory.slice(0, 3);
  //       } else if (response.data && Array.isArray(response.data.data)) {
  //         // this.olderTimelineHistory = response.data.data; // Kalau API pakai wrapper object
  //         this.allOlderTimelineHistory = response.data.data;
  //         this.olderTimelineHistory = this.allOlderTimelineHistory.slice(0, 3);
  //       } else {
  //         console.warn(
  //           'Response tidak sesuai format yang diharapkan:',
  //           response.data
  //         );
  //         this.olderTimelineHistory = [];
  //       }
  //     })
  //     .catch((error) => {
  //       console.error('Error fetching timeline history:', error);
  //     });
  // }

  fetchOlderTimeline() {
    if (!this.user || !this.user.role) {
      return;
    }

    const endpoint =
      this.user.role === 'SA'
        ? `${environment.apiUrl2}/superadmin/timeline/older`
        : `${environment.apiUrl2}/admin/timeline/older`;

    axios
      .get(endpoint, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
        params: {
          limit: 3, // Ambil 3 data per request
          offset: this.olderTimelineOffset, // Offset untuk paginasi
        },
      })
      .then((response) => {

        // Jika backend mengembalikan pesan "no other data"
        if (response.data.message === 'no other data') {
          this.hasMoreData = false; // Nonaktifkan tombol "Load More"
          this.noMoreDataMessage = 'Tidak ada data lagi yang dapat dimuat'; // Tampilkan pesan
          return;
        }

        if (Array.isArray(response.data)) {
          // Tambahkan data baru ke olderTimelineHistory
          this.olderTimelineHistory = [
            ...this.olderTimelineHistory,
            ...response.data,
          ];
          // Update offset untuk request berikutnya
          this.olderTimelineOffset += 3;
          // Jika data yang diterima kurang dari 3, artinya tidak ada data lagi
          if (response.data.length < 3) {
            this.hasMoreData = false;
          }
        } else if (response.data && Array.isArray(response.data.data)) {
          // Jika API menggunakan wrapper object
          this.olderTimelineHistory = [
            ...this.olderTimelineHistory,
            ...response.data.data,
          ];
          this.olderTimelineOffset += 3;
          if (response.data.data.length < 3) {
            this.hasMoreData = false;
          }
        } else {
          this.olderTimelineHistory = [];
        }
      })
      .catch((error) => {
        console.error('Error fetching timeline history:', error);
      });
  }

  loadMore() {
    // Fetch data baru dari backend
    this.fetchOlderTimeline();
  }

  refreshTimeline() {
    this.isLoading = true;
    console.log('Loading state:', this.isLoading); // Log state loading

    Promise.all([this.fetchRecentTimeline(), this.fetchOlderTimeline()])
      .then(() => {
      })
      .catch((error) => {
        console.error('Error refreshing timeline:', error);
      })
      .finally(() => {
        this.isLoading = false;
        console.log('Loading finished, state:', this.isLoading); // Log ketika loading selesai
      });
  }

  // loadMore() {
  //   const currentLength = this.olderTimelineHistory.length;
  //   const nextData = this.allOlderTimelineHistory.slice(
  //     currentLength,
  //     currentLength + 3
  //   );
  //   this.olderTimelineHistory = [...this.olderTimelineHistory, ...nextData];
  // }

  fetchDataFormDA(): void {
    axios
      .get(`${environment.apiUrl2}/api/my/form/da`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        if (response.data) {
          this.dataListAllFormDA = response.data;
          console.log(response.data);
          this.dataDALength = this.dataListAllFormDA.length;
        } else {
          console.log('Data is null');
          this.dataDALength = 0;
        }
      })
      .catch((error) => {
        if (error.response) {
          if (error.response.status === 500) {
            console.log(error.response.data.message);
          }
        } else {
          console.error(error);
        }
      });
  }

  fetchDataFormITCM(): void {
    axios
      .get(`${environment.apiUrl2}/api/my/form/itcm`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        if (response.data) {
          this.dataListFormITCM = response.data;
          console.log(response.data);
          this.dataITCMLength = this.dataListFormITCM.length;
        } else {
          console.log('Data is null');
          this.dataITCMLength = 0;
        }
      })
      .catch((error) => {
        if (error.response) {
          if (error.response.status === 500) {
            console.log(error.response.data.message);
          } else if (error.response.status === 404) {
            console.log(error.response.data.message);
          }
        } else {
          console.error(error);
        }
      });
  }

  fetchAllDataBA(): void {
    axios
      .get(`${environment.apiUrl2}/api/my/form/ba`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        if (response.data) {
          this.dataListAllBA = response.data;
          console.log(response.data);
          this.dataBALength = this.dataListAllBA.length;
        } else {
          console.log('Data is null');
          this.dataBALength = 0;
        }
      })
      .catch((error) => {
        if (error.response) {
          if (error.response.status === 500) {
            console.log(error.response.data.message);
          }
        } else {
          console.error(error);
        }
      });
  }

  fetchAllDataHA(): void {
    axios
      .get(`${environment.apiUrl2}/api/my/form/ha`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        if (response.data) {
          this.dataListAllHA = response.data;
          console.log('respoon ha', response);

          console.log(response.data);
          this.dataHALength = this.dataListAllHA.length;
        } else {
          console.log('Data is null');
          this.dataHALength = 0;
        }
      })
      .catch((error) => {
        if (error.response) {
          if (error.response.status === 500) {
            console.log(error.response.data.message);
          }
        } else {
          console.error(error);
        }
      });
  }

  fetchITCMSignature() {
    axios
      .get(`${environment.apiUrl2}/api/my/signature/itcm`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        if (response.data) {
          this.dataListSignatureITCM = response.data.filter(
            (item: any) => item.form_status === 'Published'
          );
          this.dataSignatureITCMLength = this.dataListSignatureITCM.length;
        } else {
          console.log('Data ITCM is null');
          this.dataSignatureITCMLength = 0;
        }
      })
      .catch((error) => {
        console.log('Error fetching ITCM signatures:', error);
        this.dataSignatureITCMLength = 0;
      });
  }

  fetchDASignature() {
    axios
      .get(`${environment.apiUrl2}/api/my/signature/da`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        if (response.data) {
          this.dataListSignatureDA = response.data.filter(
            (item: any) => item.form_status === 'Published'
          );
          this.dataSignatureDALength = this.dataListSignatureDA.length;
        } else {
          console.log('Data DA is null');
          this.dataSignatureDALength = 0;
        }
      })
      .catch((error) => {
        console.log('Error fetching DA signatures:', error);
        this.dataSignatureDALength = 0;
      });
  }

  fetchBASignature() {
    axios
      .get(`${environment.apiUrl2}/api/my/signature/ba`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        if (response.data) {
          this.dataListSignatureBA = response.data.filter(
            (item: any) => item.form_status === 'Published'
          );
          this.dataSignatureBALength = this.dataListSignatureBA.length;
        } else {
          console.log('Data BA is null');
          this.dataSignatureBALength = 0;
        }
      })
      .catch((error) => {
        console.log('Error fetching BA signatures:', error);
        this.dataSignatureBALength = 0;
      });
  }

  fetchHASignature() {
    axios
      .get(`${environment.apiUrl2}/api/my/signature/ha`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        if (response.data) {
          this.dataListSignatureHA = response.data.filter(
            (item: any) => item.form_status === 'Published'
          );
          this.dataSignatureHALength = this.dataListSignatureHA.length;
        } else {
          console.log('Data HA is null');
          this.dataSignatureHALength = 0;
        }
      })
      .catch((error) => {
        console.log('Error fetching HA signatures:', error);
        this.dataSignatureHALength = 0;
      });
  }
}
