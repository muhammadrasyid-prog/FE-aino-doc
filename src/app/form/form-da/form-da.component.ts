import { CommonModule, DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { FormDaService } from '../../services/form-da/form-da.service';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';
import axios from 'axios';
import { PdfGenerationService } from '../../services/pdf-generation.service';
// import { PdfGenerationService } from '../services/pdf-generation.service';'
// import { AlertModule } from '@coreui/angular';
import { initFlowbite } from 'flowbite';
import { Router, ActivatedRoute } from '@angular/router';
import SignaturePad from 'signature_pad';
import { ExportAsModule } from 'ngx-export-as';
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import { forkJoin } from 'rxjs';
// import { initPopovers } from 'flowbite';

interface Signatory {
  sign_uuid: string;
  signatory_name: string;
  signatory_position: string;
  role_sign: string;
  is_sign: boolean;
  // sign_img: string
  sign_img: string | { String: string };
}

interface formsDA {
  form_uuid: string;
  form_name: string;
  form_number: string;
  form_ticket: string;
  form_status: string;
  document_name: string;
  project_name: string;
  nama_analis: string;
  jabatan: string;
  departemen: string;
  jenis_perubahan: string;
  detail_dampak_perubahan: string;
  rencana_pengembangan_perubahan: string;
  rencana_pengujian_perubahan_sistem: string;
  rencana_rilis_perubahan_dan_implementasi: string;

  is_sign: boolean;
  approval_status: any;

  created_by: string;
  updated_by: string;
  updated_at: string;
  deleted_by: string;
  deleted_at: string;
}

interface Documents {
  document_uuid: string;
  document_name: string;
}

interface Projects {
  project_uuid: string;
  project_name: string;
}

interface Users {
  user_id: string;
  personal_name: string;
}

interface Detail {
  form_number: string;
  form_ticket: string;
  form_status: string;
  document_name: string;
  project_name: string;
  nama_analis: string;
  approval_status: string;
  reason: string;
  jabatan: string;
  departemen: string;
  jenis_perubahan: string;
  detail_dampak_perubahan: string;
  rencana_pengembangan_perubahan: string;
  rencana_pengujian_perubahan_sistem: string;
  rencana_rilis_perubahan_dan_implementasi: string;
  name: string;
  position: string;
  role_sign: string;
  is_sign: boolean;
}

interface Approval {
  is_approve: boolean;
  reason: string | null;
}

interface ITCMId {
  itcm_form_uuid: string;
  itcm_form_number: string;
}

@Component({
  standalone: true,
  selector: 'app-form-da',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ExportAsModule],
  templateUrl: './form-da.component.html',
  styleUrl: './form-da.component.css',
})
export class FormDaComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sigPad', { static: false })
  sigPad!: ElementRef<HTMLCanvasElement>;
  @ViewChild('modal', { static: false }) modal!: ElementRef<HTMLDivElement>;
  @ViewChild('closeButton', { static: false })
  closeButton!: ElementRef<HTMLButtonElement>;

  private signaturePad!: SignaturePad;
  img: string | null = null;
  penColor: string = '#262626'; // Default pen color

  ngAfterViewInit() {
    const canvas = this.sigPad.nativeElement;

    // Initialize SignaturePad
    this.signaturePad = new SignaturePad(canvas);
    this.signaturePad.penColor = this.penColor;

    // Resize canvas to fit the container
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));

    if (this.closeButton) {
      this.closeButton.nativeElement.addEventListener('click', () =>
        this.closeModal()
      );
    }
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
    if (this.closeButton) {
      this.closeButton.nativeElement.removeEventListener('click', () =>
        this.closeModal()
      );
    }
  }

  clear() {
    this.signaturePad.clear();
    this.img = null; // Clear the img property when the canvas is cleared
  }

  save() {
    const dataURL = this.sigPad.nativeElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'signature.png';
    link.click();
  }

  onColorChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.penColor = input.value;
    this.signaturePad.penColor = this.penColor;
  }

  private resizeCanvas() {
    const canvas = this.sigPad.nativeElement;
    const container = canvas.parentElement as HTMLElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    this.signaturePad.clear(); // Clear the canvas to fit new size
  }

  searchText: string = '';

  isPreview: boolean = false; // State untuk menampilkan preview atau tabel
  form!: FormGroup;
  dataListAllDoc: Documents[] = [];
  dataListAllProject: Projects[] = [];
  dataListAllUser: Users[] = [];

  form_uuid: string = '';
  form_number: string = '';
  form_ticket: string = '';
  form_status: string = '';
  document_uuid: string = '';
  document_name: string = '';
  project_uuid: string = '';
  project_name: string = '';
  approval_status: string = '';
  reason: string = '';
  created_by: string = '';
  created_at: string = '';
  updated_by: string = '';
  updated_at: string = '';
  deleted_by: string = '';
  deleted_at: string = '';

  isPublished: boolean = false;
  // reason: string = ''

  nama_analis: string = '';
  jabatan: string = '';
  departemen: string = '';
  jenis_perubahan: string = '';
  detail_dampak_perubahan: string = '';
  rencana_pengembangan_perubahan: string = '';
  rencana_pengujian_perubahan_sistem: string = '';
  rencana_rilis_perubahan_dan_implementasi: string = '';

  personal_name: string = '';
  name: string = '';
  position: string = '';
  role_sign: string = '';
  is_sign: boolean = false;

  user_uuid: any;
  user_name: any;
  role_code: any;

  maxDate: string = '';

  // buat itcm
  itcm_forms_id: string = '';

  itcm_form_uuid: string = '';
  itcm_form_number: string = '';

  signatories = [];
  name1: string = '';
  name2: string = '';
  name3: string = '';
  name4: string = '';
  // name5: string = '';

  position1: string = '';
  position2: string = '';
  position3: string = '';
  position4: string = '';
  // position5: string = '';

  roleSign1: string = 'Pemohon';
  roleSign2: string = 'Atasan Pemohon';
  roleSign3: string = 'Penerima';
  roleSign4: string = 'Atasan Penerima';

  is_sign1: boolean = false;
  is_sign2: boolean = false;
  is_sign3: boolean = false;
  is_sign4: boolean = false;
  // roleSign5: string = 'Atasan Pemohon';

  dataListFormDADetail: Detail[] = [];

  is_approve: boolean | null = null;
  isModalAddOpen: boolean = false;
  isModalEditOpen: boolean = false;
  isModalSignOpen: boolean = false;
  isModalApproveOpen: boolean = false;

  isDropdownOpen: boolean = false; // Status dropdown (buka/tutup)
  selectedTableId: string = '';
  AllTableIds: string[] = [
    'Mydocument',
    'Mydraft',
    'Mysignature',
    'Approved',
    'Rejected',
  ];

  // activePopover: number | null = null;
  isSigned: boolean = false;
  signatoryPositions: {
    [key: string]: {
      name: string;
      position: string;
      is_sign: boolean;
      sign_img: string;
    };
  } = {
    Pemohon: { name: '', position: '', is_sign: false, sign_img: '' },
    'Atasan Pemohon': { name: '', position: '', is_sign: false, sign_img: '' },
    Penerima: { name: '', position: '', is_sign: false, sign_img: '' },
    'Atasan Penerima': { name: '', position: '', is_sign: false, sign_img: '' },
  };

  constructor(
    private cookieService: CookieService,
    private fb: FormBuilder,
    public formDaService: FormDaService,
    private datePipe: DatePipe,
    private pdfService: PdfGenerationService,
    private route: ActivatedRoute,
    private router: Router,
    private exportAsService: ExportAsService,
    @Inject('apiUrl') private apiUrl: string
  ) {
    this.apiUrl = apiUrl;
  }

  dataListAllFormDA: formsDA[] = [];
  dataListAdminFormDA: formsDA[] = [];
  dataListUserFormDA: formsDA[] = [];

  list_itcm_forms_number: ITCMId[] = [];

  // draft
  dataListAdminFormDADraft: formsDA[] = [];
  dataListUserFormDADraft: formsDA[] = [];

  // publish
  dataListAdminFormDAPublish: formsDA[] = [];
  dataListUserFormDAPublish: formsDA[] = [];

  // approved
  dataListAdminFormDAApproved: formsDA[] = [];
  dataListUserFormDAApproved: formsDA[] = [];

  // Rejected
  dataListAdminFormDARejected: formsDA[] = [];
  dataListUserFormDARejected: formsDA[] = [];

  dataListFormDASignature: formsDA[] = [];

  ngOnInit(): void {
    // initFlowbite();
    this.profileData();

    this.listAllDoc();
    this.listAllProject();
    this.fetchAllUser();

    this.fetchDataFormDA();
    this.fetchDataAdminFormDA();
    this.fetchDataUserFormDA();
    this.fetchDocumentUUID();

    this.fetchITCMFormNumber();

    this.fetchUserSignature();

    // draft
    this.fetchDataAdminFormDADraft();
    this.fetchDataUserFormDADraft();

    // publlish
    this.fetchDataAdminFormDAPublish();
    this.fetchDataUserFormDAPublish();

    // approved
    this.fetchDataAdminFormDAApproved();
    this.fetchDataUserFormDAApproved();

    // approved
    this.fetchDataAdminFormDARejected();
    this.fetchDataUserFormDARejected();

    // this.akuApa()

    let auxDate = this.substractYearsToDate(new Date(), 0);
    this.maxDate = this.getDateFormateForSearch(auxDate);
    // console.log('rencana', this.rencana_pengembangan_perubahan);

    this.route.paramMap.subscribe((params) => {
      const form_uuid = params.get('form_uuid');
      if (form_uuid) {
        this.openPreviewPage(form_uuid); // Panggil fungsi dengan UUID dari URL
      }
    });
  }

  substractYearsToDate(date: Date, years: number): Date {
    date.setFullYear(date.getFullYear() - years);
    return date;
  }

  getDateFormateForSearch(date: Date): string {
    let year = date.toLocaleDateString('es', { year: 'numeric' });
    let month = date.toLocaleDateString('es', { month: '2-digit' });
    let day = date.toLocaleDateString('es', { day: '2-digit' });
    return `${year}-${month}-${day}`;
  }

  matchesSearch(item: any): boolean {
    const searchText = this.searchText.toLowerCase();
    return (
      (item.form_name && item.form_name.toLowerCase().includes(searchText)) ||
      (item.form_number &&
        item.form_number.toLowerCase().includes(searchText)) ||
      (item.form_ticket &&
        item.form_ticket.toLowerCase().includes(searchText)) ||
      (item.document_name &&
        item.document_name.toLowerCase().includes(searchText)) ||
      (item.project_name &&
        item.project_name.toLowerCase().includes(searchText))
    );
  }

  woilah() {
    alert('wkkwkwkwkwkw gatau blm bisa');
  }

  async profileData(): Promise<void> {
    const token = this.cookieService.get('userToken');

    try {
      const response = await axios.get(`${this.apiUrl}/auth/my/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      this.user_uuid = response.data.user_uuid;
      this.user_name = response.data.user_name;
      this.role_code = response.data.role_code;
      this.personal_name = response.data.personal_name;
      console.log('personal name: ', this.personal_name);
    } catch (error) {
      if (error instanceof axios.AxiosError) {
        if (error.response?.status === 500 || error.response?.status === 404) {
          console.log(error.response.data);
        }
      } else {
        console.error('Unexpected error:', error);
      }
    }
  }

  listAllDoc(): void {
    axios
      .get(`${environment.apiUrl2}/document`)
      .then((response) => {
        this.dataListAllDoc = response.data;
      })
      .catch((error) => {
        if (error.response.status === 500) {
          console.log(error.response.data);
        } else {
          console.log(error.response.data);
        }
      });
  }

  listAllProject(): void {
    axios
      .get(`${environment.apiUrl2}/project`)
      .then((response) => {
        this.dataListAllProject = response.data;
      })
      .catch((error) => {
        if (error.response.status === 500) {
          console.log(error.response.data);
        } else {
          console.log(error.response.data);
        }
      });
  }

  fetchDataFormDA() {
    axios
      .get(`${environment.apiUrl2}/dampak/analisa`)
      .then((response) => {
        this.dataListAllFormDA = response.data;
        console.log(response.data);
      })
      .catch((error) => {
        console.log(error.response);
        if (error.response.status === 500) {
          console.log(error.response.data);
        }
      });
  }

  fetchDataAdminFormDA(): void {
    axios
      .get(`${environment.apiUrl2}/admin/my/da/division`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        this.dataListAdminFormDA = response.data;
        console.log(response.data);
      })
      .catch((error) => {
        if (error.response.status === 500) {
          console.log(error.response.data);
        } else {
          console.log(error.response.data);
        }
      });
  }

  fetchDataUserFormDA() {
    axios
      .get(`${environment.apiUrl2}/api/my/form/da`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        console.log('user', response);

        this.dataListUserFormDA = response.data;
      })
      .catch((error) => {
        if (error.response.status === 500) {
          console.log(error.response.data);
        } else {
          console.log(error.response.data);
        }
      });
  }

  fetchAllUser() {
    axios
      .get(`${this.apiUrl}/personal/name/all`)
      .then((response) => {
        this.dataListAllUser = response.data;
        console.log('user', this.dataListAllUser);
      })
      .catch((error) => {
        if (error.response.status === 500) {
          console.log(error.response.data);
        } else {
          console.log(error.response.data);
        }
      });
  }

  fetchDocumentUUID(): void {
    axios
      .get(`${environment.apiUrl2}/form/da/code`)
      .then((response) => {
        this.document_uuid = response.data.document_uuid;
        console.log('Document UUID:', this.document_uuid);
      })
      .catch((error) => {
        console.error('Error fetching document UUID:', error);
      });
  }

  fetchITCMFormNumber() {
    axios
      .get(`${environment.apiUrl2}/api/my/form/itcm`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        console.log('ini wir', response.data);

        if (response.data.length > 0) {
          this.list_itcm_forms_number = response.data.map((form: any) => ({
            itcm_form_number: form.form_number,
            itcm_form_uuid: form.form_uuid,
          }));

          console.log('All ITCM forms:', this.list_itcm_forms_number);
        } else {
          console.log('No ITCM forms found.');
        }
      })
      .catch((error) => {
        console.log(error.response);
      });
  }

  // signature
  fetchUserSignature() {
    axios
      .get(`${environment.apiUrl2}/api/my/signature/da`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        this.dataListFormDASignature = response.data.filter(
          (item: any) => item.form_status === 'Published'
        );

        console.log('user signature', this.dataListFormDASignature);

        if (this.dataListFormDASignature.length === 0) {
          console.log('No published signatures found.');
        }
      })
      .catch((error) => {
        if (error.response.status === 500) {
          console.log(error.response.data);
        } else {
          console.log(error.response.data);
        }
      });
  }

  // draft admin
  fetchDataAdminFormDADraft(): void {
    axios
      .get(`${environment.apiUrl2}/admin/my/da/division`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        this.dataListAdminFormDADraft = response.data.filter(
          (item: any) => item.form_status === 'Draft'
        );

        if (this.dataListAdminFormDADraft.length === 0) {
          console.log('No draft documents found for admin.');
        }
      })
      .catch((error) => {
        if (error.response.status === 500) {
          console.log(error.response.data);
        } else {
          console.log(error.response.data);
        }
      });
  }

  // draft user
  fetchDataUserFormDADraft() {
    axios
      .get(`${environment.apiUrl2}/api/my/form/da`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        this.dataListUserFormDADraft = response.data.filter(
          (item: any) => item.form_status === 'Draft'
        );

        if (this.dataListUserFormDADraft.length === 0) {
          console.log('No draft documents found for user.');
        }
      })
      .catch((error) => {
        if (error.response.status === 500) {
          console.log(error.response.data);
        } else {
          console.log(error.response.data);
        }
      });
  }

  // Publish admin
  fetchDataAdminFormDAPublish(): void {
    axios
      .get(`${environment.apiUrl2}/admin/da/all`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        this.dataListAdminFormDAPublish = response.data.filter(
          (item: any) => item.form_status === 'Published'
        );

        if (this.dataListAdminFormDAPublish.length === 0) {
          console.log('No published documents found for admin.');
        }
      })
      .catch((error) => {
        if (error.response.status === 500) {
          console.log(error.response.data);
        } else {
          console.log(error.response.data);
        }
      });
  }

  // Publish user
  fetchDataUserFormDAPublish() {
    axios
      .get(`${environment.apiUrl2}/api/my/form/da`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        this.dataListUserFormDAPublish = response.data.filter(
          (item: any) => item.form_status === 'Published'
        );

        if (this.dataListUserFormDAPublish.length === 0) {
          console.log('No published documents found for user.');
        }
      })
      .catch((error) => {
        if (error.response.status === 500) {
          console.log(error.response.data);
        } else {
          console.log(error.response.data);
        }
      });
  }

  // Approved admin
  fetchDataAdminFormDAApproved(): void {
    axios
      .get(`${environment.apiUrl2}/admin/da/all`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        this.dataListAdminFormDAApproved = response.data.filter(
          (item: any) => item.approval_status === 'Disetujui'
        );

        if (this.dataListAdminFormDAApproved.length === 0) {
          console.log('No approved documents found for admin.');
        }
      })
      .catch((error) => {
        if (error.response.status === 500) {
          console.log(error.response.data);
        } else {
          console.log(error.response.data);
        }
      });
  }

  // Approved user
  fetchDataUserFormDAApproved() {
    axios
      .get(`${environment.apiUrl2}/api/my/form/da`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        this.dataListUserFormDAApproved = response.data.filter(
          (item: any) => item.approval_status === 'Disetujui'
        );

        if (this.dataListUserFormDAApproved.length === 0) {
          console.log('No approved documents found for user.');
        }
      })
      .catch((error) => {
        if (error.response.status === 500) {
          console.log(error.response.data);
        } else {
          console.log(error.response.data);
        }
      });
  }

  // Rejected admin
  fetchDataAdminFormDARejected(): void {
    axios
      .get(`${environment.apiUrl2}/admin/da/all`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        this.dataListAdminFormDARejected = response.data.filter(
          (item: any) => item.approval_status === 'Tidak Disetujui'
        );

        if (this.dataListAdminFormDARejected.length === 0) {
          console.log('No Rejected documents found for admin.');
        }
      })
      .catch((error) => {
        if (error.response.status === 500) {
          console.log(error.response.data);
        } else {
          console.log(error.response.data);
        }
      });
  }

  // Rejected user
  fetchDataUserFormDARejected() {
    axios
      .get(`${environment.apiUrl2}/api/my/form/da`, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
      .then((response) => {
        this.dataListUserFormDARejected = response.data.filter(
          (item: any) => item.approval_status === 'Tidak Disetujui'
        );

        if (this.dataListUserFormDARejected.length === 0) {
          console.log('No Rejected documents found for user.');
        }
      })
      .catch((error) => {
        if (error.response.status === 500) {
          console.log(error.response.data);
        } else {
          console.log(error.response.data);
        }
      });
  }

  openTab = 1;
  toggleTabs($tabNumber: number) {
    this.openTab = $tabNumber;
  }

  // buat popover option di tabel
  popoverIndex: number | null = null;

  togglePopover(event: Event, index: number): void {
    event.stopPropagation(); // Menghentikan event bubbling
    if (this.popoverIndex === index) {
      this.popoverIndex = null; // Tutup popover jika diklik lagi
    } else {
      this.popoverIndex = index; // Buka popover untuk baris ini
    }
  }

  closePopover() {
    this.popoverIndex = null;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (this.popoverIndex !== null) {
      const clickedElement = event.target as HTMLElement;
      const popoverElement = document.querySelector('.popover-content');
      if (popoverElement && !popoverElement.contains(clickedElement)) {
        this.closePopover();
      }
    }
  }

  handleAction(action: string, item: any): void {
    // console.log(Handling ${action} for:, item);
    this.closePopover();
  }

  // openApproveModal(form_uuid: string) {
  //   console.log();
  // }

  handleKeyDown(event: KeyboardEvent) {
    console.log(`Key pressed: ${event.key}`); // Debug output
    if (event.key === 'Escape') {
      this.closeAddModal();
      this.closeEditModal();
      this.closeApproveModal();
      this.closeSignModal();
      console.log('Modals closed');
    }
  }

  openAddModal() {
    this.isModalAddOpen = true;
    this.form_ticket = '';
    this.project_uuid = '';
    this.nama_analis = '';
    this.jabatan = '';
    this.departemen = '';
    this.jenis_perubahan = '';
    this.detail_dampak_perubahan = '';
    this.rencana_pengembangan_perubahan = '';
    this.rencana_pengujian_perubahan_sistem = '';
    this.rencana_rilis_perubahan_dan_implementasi = '';
    this.name1 = '';
    this.position1 = '';
    this.roleSign1 = this.roleSign1;
    this.name2 = '';
    this.position2 = '';
    this.roleSign2 = this.roleSign2;
    this.name3 = '';
    this.position3 = '';
    this.roleSign3 = this.roleSign3;
    this.name4 = '';
    this.position4 = '';
    this.roleSign4 = this.roleSign4;
    // this.name5 = '';
    // this.position5 = '';
    // this.roleSign5 = '';
    // console.log('add da');
  }
  closeAddModal() {
    this.isModalAddOpen = false;
  }

  addFormDA(): void {
    const token = this.cookieService.get('userToken');
    console.log('Document UUID:', this.document_uuid);

    const requestDataFormDA = {
      isPublished: false,
      formData: {
        document_uuid: this.document_uuid,
        form_ticket: this.form_ticket,
        project_uuid: this.project_uuid,
      },
      data_da: {
        itcm_form_uuid: this.itcm_form_uuid,
        nama_analis: this.nama_analis,
        jabatan: this.jabatan,
        departemen: this.departemen,
        jenis_perubahan: this.jenis_perubahan,
        detail_dampak_perubahan: this.detail_dampak_perubahan,
        rencana_pengembangan_perubahan: this.rencana_pengembangan_perubahan,
        rencana_pengujian_perubahan_sistem:
          this.rencana_pengujian_perubahan_sistem,
        rencana_rilis_perubahan_dan_implementasi:
          this.rencana_rilis_perubahan_dan_implementasi,
      },
      signatories: [
        {
          name: this.name1,
          position: this.position1,
          role_sign: this.roleSign1,
        },
        {
          name: this.name2,
          position: this.position2,
          role_sign: this.roleSign2,
        },
        {
          name: this.name3,
          position: this.position3,
          role_sign: this.roleSign3,
        },
        {
          name: this.name4,
          position: this.position4,
          role_sign: this.roleSign4,
        },
        // {
        //   name: this.name5,
        //   postion: this.position5,
        //   role_sign: this.roleSign5,
        // },
      ],
    };
    console.log('ini add da ', requestDataFormDA);

    console.log(this.document_uuid);
    axios
      .post(`${environment.apiUrl2}/api/add/da`, requestDataFormDA, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        Swal.fire({
          icon: 'success',
          title: 'SUCCESS',
          text: response.data.message,
          timer: 2000,
          timerProgressBar: true,
          showCancelButton: false,
          showConfirmButton: false,
        });

        // tambah ini biar setelah add ga perlu refresh agar bisa muncul
        this.fetchDataFormDA();
        this.fetchDataAdminFormDA();
        this.fetchDataUserFormDA();
        this.fetchDataAdminFormDADraft();
        this.fetchDataUserFormDADraft();
        this.fetchDataAdminFormDAPublish();
        this.fetchDataUserFormDAPublish();
        this.fetchUserSignature();
      })
      .catch((error) => {
        console.log(error.response.data.message);
        if (
          error.response.status === 401 ||
          error.response.status === 500 ||
          error.response.status === 400
        ) {
          Swal.fire({
            icon: 'error',
            title: 'ERROR',
            text: error.response.data.message,
            timer: 2000,
            timerProgressBar: true,
            showCancelButton: false,
            showConfirmButton: false,
          });
        }
      });
    this.isModalAddOpen = false;
  }

  openEditModal(form_uuid: string) {
    axios
      .get(`${environment.apiUrl2}/da/${form_uuid}`)
      .then((response) => {
        const formData = response.data.form;
        if (formData.form_status === 'Published') {
          Swal.fire({
            title: 'Konfirmasi',
            text: 'Anda yakin ingin mengedit Formulir ini? Setelah diedit, formulir akan kembali menjadi Draft dan semua signatories akan dihapus',
            // imageUrl: 'https://i.pinimg.com/474x/26/6e/9b/266e9b164cd6dc2aeeabfb7ce9e15fe9.jpg', // URL gambar yang ingin kamu tampilkan
            // imageWidth: 100, // Ubah ukuran lebar gambar
            // imageHeight: 100, // Ubah ukuran tinggi gambar
            // imageAlt: 'Custom image', // Teks alternatif untuk gambar
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya',
            cancelButtonText: 'Tidak',
          }).then((result) => {
            if (result.isConfirmed) {
              this.isModalEditOpen = true;
            }
          });
        } else if (formData.form_status === 'Draft') {
          this.isModalEditOpen = true;
        }

        console.log('edit', response.data);

        // const formData = response.data.form;
        this.form_uuid = formData.form_uuid;
        this.form_number = formData.form_number;
        this.form_ticket = formData.form_ticket;
        this.form_status = formData.form_status;
        this.document_name = formData.document_name;
        this.project_uuid = formData.project_uuid;
        this.project_name = formData.project_name;
        this.itcm_form_uuid = formData.itcm_form_uuid;
        this.nama_analis = formData.nama_analis;
        this.jabatan = formData.jabatan;
        this.departemen = formData.departemen;
        this.jenis_perubahan = formData.jenis_perubahan;
        this.detail_dampak_perubahan = formData.detail_dampak_perubahan;
        this.rencana_pengembangan_perubahan =
          formData.rencana_pengembangan_perubahan;
        this.rencana_pengujian_perubahan_sistem =
          formData.rencana_pengujian_perubahan_sistem;
        this.rencana_rilis_perubahan_dan_implementasi =
          formData.rencana_rilis_perubahan_dan_implementasi;

        // ini untuk edit penerima, tp masih bingung
        const signData: Signatory[] = response.data.signatories;
        signData.forEach((sign: Signatory) => {
          const role = sign.role_sign;
          if (this.signatoryPositions[role]) {
            this.signatoryPositions[role].name = sign.signatory_name;
            this.signatoryPositions[role].position = sign.signatory_position;
            this.signatoryPositions[role].is_sign = sign.is_sign;
          }
        });

        console.log('p', this.signatoryPositions);

        console.log('signdata', signData);

        const existingProject = this.dataListAllProject.find(
          (project) => project.project_name === formData.project_name
        );
        this.project_uuid = existingProject ? existingProject.project_uuid : '';

        // const existingITCMNumber = this.dataListAllProject.find(
        //   (project) => project.project_name === formData.project_name
        // );
        // this.itcm_form_uuid = existingITCMNumber ? existingITCMNumber.project_uuid : '';
      })
      .catch((error) => {
        if (error.response.status === 500) {
          Swal.fire({
            title: 'Error',
            text: error.response.data.message,
            icon: 'error',
            timer: 2000,
            timerProgressBar: true,
            showCancelButton: false,
            showConfirmButton: false,
          });
        } else {
          console.log(error.response.data);
        }
      });
  }

  closeEditModal() {
    this.isModalEditOpen = false;
  }

  updateFormDA() {
    const data = {
      // isPublished: false,
      formData: {
        document_uuid: this.document_uuid,
        form_ticket: this.form_ticket,
        project_uuid: this.project_uuid,
      },
      data_da: {
        itcm_form_uuid: this.itcm_form_uuid,
        nama_analis: this.nama_analis,
        jabatan: this.jabatan,
        departemen: this.departemen,
        jenis_perubahan: this.jenis_perubahan,
        detail_dampak_perubahan: this.detail_dampak_perubahan,
        rencana_pengembangan_perubahan: this.rencana_pengembangan_perubahan,
        rencana_pengujian_perubahan_sistem:
          this.rencana_pengujian_perubahan_sistem,
        rencana_rilis_perubahan_dan_implementasi:
          this.rencana_rilis_perubahan_dan_implementasi,
      },
      signatories: [
        {
          name: this.signatoryPositions['Pemohon'].name,
          position: this.signatoryPositions['Pemohon'].position,
          role_sign: 'Pemohon',
        },
        {
          name: this.signatoryPositions['Atasan Pemohon'].name,
          position: this.signatoryPositions['Atasan Pemohon'].position,
          role_sign: 'Atasan Pemohon',
        },
        {
          name: this.signatoryPositions['Penerima'].name,
          position: this.signatoryPositions['Penerima'].position,
          role_sign: 'Penerima',
        },
        {
          name: this.signatoryPositions['Atasan Penerima'].name,
          position: this.signatoryPositions['Atasan Penerima'].position,
          role_sign: 'Atasan Penerima',
        },
      ],
    };
    console.log('ini data sama sign', data);

    axios
      .put(
        `${environment.apiUrl2}/api/dampak/analisa/update/${this.form_uuid}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${this.cookieService.get('userToken')}`,
          },
        }
      )
      .then((response) => {
        Swal.fire({
          icon: 'success',
          title: 'SUCCESS',
          text: response.data.message,
          timer: 2000,
          timerProgressBar: true,
          showCancelButton: false,
          showConfirmButton: false,
        });

        // tambah ini biar setelah add ga perlu refresh agar bisa muncul
        this.fetchDataFormDA();
        this.fetchDataAdminFormDA();
        this.fetchDataUserFormDA();
        this.fetchDataAdminFormDADraft();
        this.fetchDataUserFormDADraft();
        this.fetchDataAdminFormDAPublish();
        this.fetchDataUserFormDAPublish();
        this.fetchUserSignature();
      })
      .catch((error) => {
        if (
          error.response.status === 404 ||
          error.response.status === 500 ||
          error.response.status === 422 ||
          error.response.status === 400
        ) {
          console.log(error.response);
          Swal.fire({
            title: 'Error',
            text: error.response.data.message,
            icon: 'error',
            timer: 2000,
            timerProgressBar: true,
            showCancelButton: false,
            showConfirmButton: false,
          });
        }
      });
    this.isModalEditOpen = false;
  }

  publish(form_uuid: string, form_ticket: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Apakah anda yakin untuk mempublish dokumen ini? Setelah dokumen dipublish, dokumen tidak dapat dikembalikan.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, publish it!',
    }).then((result) => {
      if (result.isConfirmed) {
        // Panggil API untuk mempublish dokumen
        axios
          .put(
            `${environment.apiUrl2}/api/form/update/${form_uuid}`,
            {
              isPublished: true,
              formData: {
                form_ticket: form_ticket,
                document_uuid: this.document_uuid,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${this.cookieService.get('userToken')}`,
              },
            }
          )
          .then((response) => {
            Swal.fire({
              icon: 'success',
              title: 'SUCCESS',
              text: 'Berhasil dipublish!',
              timer: 2000,
              timerProgressBar: true,
              showCancelButton: false,
              showConfirmButton: false,
            });

            // tambah ini biar setelah add ga perlu refresh agar bisa muncul
            this.fetchDataFormDA();
            this.fetchDataAdminFormDA();
            this.fetchDataUserFormDA();
            this.fetchDataAdminFormDADraft();
            this.fetchDataUserFormDADraft();
            this.fetchDataAdminFormDAPublish();
            this.fetchDataUserFormDAPublish();
            this.fetchUserSignature();
          })
          .catch((error) => {
            Swal.fire({
              title: 'Error',
              text: error.response.data.message,
              icon: 'error',
              timer: 2000,
              timerProgressBar: true,
              showCancelButton: false,
              showConfirmButton: false,
            });
          });
      }
    });
  }

  async openPreviewPage(form_uuid: string) {
    await this.profileData();
    axios
      .get(`${environment.apiUrl2}/da/${form_uuid}`)
      .then((response) => {
        const BASE_URL = environment.apiUrl2;
        console.log('ada sign img', response);

        // Proses data dan perbarui UI di sini
        const formData = response.data.form;
        this.form_uuid = formData.form_uuid;
        this.created_at = formData.created_at;
        this.form_ticket = formData.form_ticket;
        this.form_status = formData.form_status;
        this.form_number = formData.form_number;
        this.document_name = formData.document_name;
        this.project_name = formData.project_name;
        this.approval_status = formData.approval_status;
        this.reason = formData.reason?.String || '';
        this.nama_analis = formData.nama_analis;
        this.jabatan = formData.jabatan;
        this.departemen = formData.departemen;
        this.jenis_perubahan = formData.jenis_perubahan;
        this.detail_dampak_perubahan = formData.detail_dampak_perubahan;
        this.rencana_pengembangan_perubahan =
          formData.rencana_pengembangan_perubahan;
        this.rencana_pengujian_perubahan_sistem =
          formData.rencana_pengujian_perubahan_sistem;
        this.rencana_rilis_perubahan_dan_implementasi =
          formData.rencana_rilis_perubahan_dan_implementasi;
        this.isPreview = true;
        this.router.navigate([`/form/da/${form_uuid}`]);

        // Update signatory positions
        const signatories: Signatory[] = response.data.signatories || [];
        Object.keys(this.signatoryPositions).forEach((role) => {
          this.signatoryPositions[role] = {
            name: '',
            position: '',
            is_sign: false,
            sign_img: '',
          };
        });
        signatories.forEach((signatory: Signatory) => {
          const role = signatory.role_sign;
          if (this.signatoryPositions[role]) {
            this.signatoryPositions[role] = {
              name: signatory.signatory_name || '',
              position: signatory.signatory_position || '',
              is_sign: signatory.is_sign || false,
              sign_img:
                typeof signatory.sign_img === 'object' &&
                'String' in signatory.sign_img
                  ? BASE_URL + signatory.sign_img.String
                  : BASE_URL + signatory.sign_img,
            };
          }
        });

        // udh bener tp kadang undefined
        if (signatories && signatories.length > 0) {
          const mySignatory = signatories.find(
            (signatory: Signatory) =>
              signatory?.signatory_name === this.personal_name
          );
          console.log('plis', mySignatory);

          if (mySignatory) {
            console.log('Sign UUID:', mySignatory.sign_uuid);
            this.isSigned = mySignatory.is_sign;
          } else {
            console.log(
              'Signatory not found for personal_name:',
              this.personal_name
            );
          }
        } else {
          console.log('Signatories array is empty or undefined');
        }
      })
      .catch((error) => {
        if (error.response) {
          if (error.response.status === 404) {
            // Navigasi ke halaman Not Found jika data tidak ditemukan
            this.router.navigate(['/not-found']);
          } else if (error.response.status === 500) {
            Swal.fire({
              title: 'Error',
              text: error.response.data.message,
              icon: 'error',
              timer: 2000,
              timerProgressBar: true,
              showCancelButton: false,
              showConfirmButton: false,
              confirmButtonText: 'OK',
            });
          } else {
            console.error('HTTP Error:', error.response);
          }
        } else {
          console.error('Network Error:', error);
        }
      });
  }

  closePreviewPage() {
    this.isPreview = false;

    this.router.navigate([`/form/da`]);
  }

  openSignModal(form_uuid: string) {
    this.form_uuid = form_uuid;
    this.isModalSignOpen = true;
  }

  closeSignModal() {
    this.isModalSignOpen = false;
  }

  openApproveModal(form_uuid: string) {
    axios
      .get(`${environment.apiUrl2}/da/${form_uuid}`)
      .then((response) => {
        console.log(response);
        const formData = response.data.form;
        this.created_at = formData.created_at;
        this.form_ticket = formData.form_ticket;
        this.form_number = formData.form_number;
        this.form_uuid = formData.form_uuid;

        this.is_approve = null;
        this.reason = '';
        this.isModalApproveOpen = true;
      })
      .catch((error) => {
        if (error.response && error.response.status === 500) {
          Swal.fire({
            title: 'Error',
            text: error.response.data.message,
            icon: 'error',
            timer: 2000,
            timerProgressBar: true,
            showCancelButton: false,
            showConfirmButton: false,
            confirmButtonText: 'OK',
          });
        } else {
          console.error(error);
        }
      });
  }

  closeApproveModal() {
    this.isModalApproveOpen = false;
  }

  approveForm(form_uuid: string) {
    const formData = {
      is_approve: this.is_approve,
      reason: this.is_approve ? '' : this.reason,
    };

    axios
      .put(
        `${environment.apiUrl2}/api/form/da/approval/${form_uuid}`,
        formData, // Send the correct form data
        {
          headers: {
            Authorization: `Bearer ${this.cookieService.get('userToken')}`,
          },
        }
      )
      .then((response) => {
        console.log(response.data.message);
        Swal.fire({
          title: 'Success',
          text: response.data.message,
          icon: 'success',
          timer: 2000,
          timerProgressBar: true,
          showCancelButton: false,
          showConfirmButton: false,
        });
        this.fetchDataFormDA();
        this.fetchDataAdminFormDA();
        this.fetchDataUserFormDA();
        this.isModalApproveOpen = false;
        this.openPreviewPage(form_uuid);
      })
      .catch((error) => {
        if (error.response.status === 404 || error.response.status === 500) {
          Swal.fire({
            title: 'Error',
            text: error.response.data.message,
            icon: 'error',
            timer: 2000,
            timerProgressBar: true,
            showCancelButton: false,
            showConfirmButton: false,
          });
        }
      });
  }

  onDeleteFormDA(form_uuid: string) {
    Swal.fire({
      title: 'Konfirmasi',
      text: 'Anda yakin ingin menghapus Formulir ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya',
      cancelButtonText: 'Tidak',
    }).then((result) => {
      if (result.isConfirmed) {
        this.performDeleteFormDA(form_uuid);
      }
    });
  }

  performDeleteFormDA(form_uuid: string) {
    axios
      .put(
        `${environment.apiUrl2}/api/form/delete/${form_uuid}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.cookieService.get('userToken')}`,
          },
        }
      )
      .then((response) => {
        console.log(response.data.message);
        Swal.fire({
          title: 'Success',
          text: response.data.message,
          icon: 'success',
          timer: 2000,
          timerProgressBar: true,
          showCancelButton: false,
          showConfirmButton: false,
        });

        // tambah ini biar setelah add ga perlu refresh agar bisa muncul
        this.fetchDataFormDA();
        this.fetchDataAdminFormDA();
        this.fetchDataUserFormDA();
        this.fetchDataAdminFormDADraft();
        this.fetchDataUserFormDADraft();
        this.fetchDataAdminFormDAPublish();
        this.fetchDataUserFormDAPublish();
        this.fetchUserSignature();
      })
      .catch((error) => {
        if (error.response.status === 404 || error.response.status === 500) {
          Swal.fire({
            title: 'Error',
            text: error.response.data.message,
            icon: 'error',
            timer: 2000,
            timerProgressBar: true,
            showCancelButton: false,
            showConfirmButton: false,
          });
        }
      });
  }

  openModal(form_uuid: string) {
    this.form_uuid = form_uuid;
    if (this.modal) {
      this.modal.nativeElement.classList.add('scale-100');
    }
  }

  closeModal() {
    if (this.modal) {
      this.modal.nativeElement.classList.remove('scale-100');
    }
    this.clear();
  }

  signature(form_uuid: string) {
    const dataURL = this.sigPad.nativeElement.toDataURL('image/png'); // Get the signature image

    axios.get(`${environment.apiUrl2}/da/${form_uuid}`).then((response) => {
      const signatories: Signatory[] = response.data.signatories || [];

      Object.keys(this.signatoryPositions).forEach((role) => {
        this.signatoryPositions[role] = {
          name: '',
          position: '',
          is_sign: false,
          sign_img: '', // Initially empty
        };
      });

      signatories.forEach((signatory: Signatory) => {
        const role = signatory.role_sign;
        if (this.signatoryPositions[role]) {
          this.signatoryPositions[role] = {
            name: signatory.signatory_name || '',
            position: signatory.signatory_position || '',
            is_sign: signatory.is_sign || false,
            sign_img:
              typeof signatory.sign_img === 'string'
                ? signatory.sign_img
                : (signatory.sign_img as { String: string }).String || '',
          };
        }
      });

      const mySignatory = signatories.find(
        (signatory: Signatory) =>
          signatory.signatory_name === this.personal_name
      );

      if (mySignatory) {
        console.log('Signatory details:', mySignatory);
        console.log('Sign UUID:', mySignatory.sign_uuid);

        // Prepare payload to send, including the signature image
        const payload = {
          name: mySignatory.signatory_name,
          position: mySignatory.signatory_position,
          is_sign: true,
          sign_img: dataURL, // Include the Base64 signature image
        };

        // Send the update to the backend
        this.onSignature(mySignatory.sign_uuid, payload);
      } else {
        console.log(
          'Signatory not found for personal_name:',
          this.personal_name
        );
      }
    });
  }

  onSignature(sign_uuid: string, payload: any) {
    console.log('pailod', payload);

    axios
      .put(
        `${environment.apiUrl2}/api/signature/update/${sign_uuid}`,
        payload, // Send the entire payload with image
        {
          headers: {
            Authorization: `Bearer ${this.cookieService.get('userToken')}`,
          },
        }
      )
      .then((response) => {
        Swal.fire({
          icon: 'success',
          title: 'SUCCESS',
          text: response.data.message,
          timer: 2000,
          timerProgressBar: true,
          showCancelButton: false,
          showConfirmButton: false,
        });

        this.closeModal();
        // tambah ini biar setelah add ga perlu refresh agar bisa muncul
        this.fetchDataFormDA();
        this.fetchDataAdminFormDA();
        this.fetchDataUserFormDA();
        this.fetchDataAdminFormDADraft();
        this.fetchDataUserFormDADraft();
        this.fetchDataAdminFormDAPublish();
        this.fetchDataUserFormDAPublish();
        this.fetchUserSignature();
        this.openPreviewPage(this.form_uuid);
      })
      .catch((error) => {
        if (
          error.response.status === 404 ||
          error.response.status === 500 ||
          error.response.status === 422 ||
          error.response.status === 400
        ) {
          console.log(error.response);
          Swal.fire({
            title: 'Error',
            text: error.response.data.message,
            icon: 'error',
            timer: 2000,
            timerProgressBar: true,
            showCancelButton: false,
            showConfirmButton: false,
          });
        }
      });
  }

  downloadData(form_uuid: string) {
    console.log('downloadData called with', form_uuid);
    axios
      .get(`${environment.apiUrl2}/da/${form_uuid}`)
      .then((response) => {
        const formData = response.data.form;

        // Periksa apakah formData ada dan memiliki properti yang diperlukan
        if (formData) {
          this.form_ticket = formData.form_ticket;
          this.form_status = formData.form_status;
          this.form_number = formData.form_number;
          this.document_name = formData.document_name;
          this.project_name = formData.project_name;
          this.approval_status = formData.approval_status;
          this.reason = formData.reason?.String || '';
          this.nama_analis = formData.nama_analis;
          this.jabatan = formData.jabatan;
          this.departemen = formData.departemen;
          this.jenis_perubahan = formData.jenis_perubahan;
          this.detail_dampak_perubahan = formData.detail_dampak_perubahan;
          this.rencana_pengembangan_perubahan =
            formData.rencana_pengembangan_perubahan;
          this.rencana_pengujian_perubahan_sistem =
            formData.rencana_pengujian_perubahan_sistem;
          this.rencana_rilis_perubahan_dan_implementasi =
            formData.rencana_rilis_perubahan_dan_implementasi;

          // Panggil fungsi untuk menghasilkan PDF
          this.downloadPdfAction();
        } else {
          console.error('Form data is not present in the response');
        }
      })
      .catch((error) => {
        console.error('Error fetching document data:', error);
      });
  }

  downloadPdfAction() {
    // Pastikan data sudah diambil dan siap untuk digunakan
    if (this.form_ticket) {
      this.pdfService
        .generatePdf({
          form_ticket: this.form_ticket,
          form_status: this.form_status,
          form_number: this.form_number,
          document_name: this.document_name,
          project_name: this.project_name,
          approval_status: this.approval_status,
          reason: this.reason,
          nama_analis: this.nama_analis,
          jabatan: this.jabatan,
          departemen: this.departemen,
          jenis_perubahan: this.jenis_perubahan,
          detail_dampak_perubahan: this.detail_dampak_perubahan,
          rencana_pengembangan_perubahan: this.rencana_pengembangan_perubahan,
          rencana_pengujian_perubahan_sistem:
            this.rencana_pengujian_perubahan_sistem,
          rencana_rilis_perubahan_dan_implementasi:
            this.rencana_rilis_perubahan_dan_implementasi,
        })
        .then(() => {
          console.log('PDF generation completed');
        })
        .catch((error) => {
          console.error('Error generating PDF:', error);
        });
    } else {
      console.error('Data is not ready for PDF generation');
    }
  }

  tabIndent(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault(); // Mencegah tab berpindah fokus
      const textarea = event.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Menambahkan tab pada posisi kursor
      textarea.value =
        textarea.value.substring(0, start) +
        '\t' +
        textarea.value.substring(end);

      // Mengatur posisi kursor setelah tab
      textarea.selectionStart = textarea.selectionEnd = start + 1;

      // Update ngModel value
      this.detail_dampak_perubahan = textarea.value;
    }
  }

  // copy
  generateURL(form_uuid: string) {
    // Generate URL
    const url = `${window.location.origin}/form/da/${form_uuid}`;

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          alert('URL copied to clipboard: ' + url);
        })
        .catch((err) => {
          console.error('Failed to copy URL: ', err);
        });
    } else {
      this.fallbackCopyTextToClipboard(url);
    }
  }

  fallbackCopyTextToClipboard(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);

    textArea.select();
    try {
      document.execCommand('copy');
      Swal.fire({
        icon: 'success',
        title: 'SUCCESS',
        text: 'Berhasil Generate link',
        timer: 2000,
        timerProgressBar: true,
        showCancelButton: false,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Fallback: Could not copy text', err);
    }

    document.body.removeChild(textArea);
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  exportToExcel(tableId: string) {
    this.selectedTableId = tableId;
    this.isDropdownOpen = false; // Tutup dropdown setelah memilih

    const excelConfig: ExportAsConfig = {
      type: 'xlsx',
      elementIdOrContent: tableId,
    };

    this.exportAsService
      .save(excelConfig, `Export ITCM-${tableId}`)
      .subscribe(() => {
        console.log(`Excel ${tableId} berhasil diunduh!`);
      });
  }

  exportAllTablesToExcel() {
    this.isDropdownOpen = false; // Tutup dropdown

    // Ekspor semua tabel sekaligus
    const exportTasks = this.AllTableIds.map((tableId) => {
      const excelConfig: ExportAsConfig = {
        type: 'xlsx',
        elementIdOrContent: tableId,
      };
      // Nama file berdasarkan ID tabel untuk membedakan file
      return this.exportAsService.save(excelConfig, `Export ITCM-${tableId}`);
    });

    // Jalankan semua ekspor secara paralel
    forkJoin(exportTasks).subscribe(
      () => {
        console.log('Semua tabel berhasil diunduh!');
      },
      (error) => {
        console.error('Terjadi kesalahan saat mengunduh tabel:', error);
      }
    );
  }
}

export { formsDA };
