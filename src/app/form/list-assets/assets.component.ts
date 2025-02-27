import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Inject,
  OnInit,
} from '@angular/core';
import { environment } from '../../../environments/environment';
import axios from 'axios';
import { CookieService } from 'ngx-cookie-service';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import Swal from 'sweetalert2';
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import { ExportAsModule } from 'ngx-export-as';
import { AvatarModule, AvatarSource } from 'ngx-avatars';
// import { HttpClientModule } from '@angular/common/http';
import * as XLSX from 'xlsx';

interface Signatory {
  sign_uuid: string;
  signatory_name: string;
  signatory_position: string;
  role_sign: string;
  is_sign: boolean;
  sign_img: string | { String: string };
}

interface Assets {
  asset_uuid: string;
  kode_asset: string;
  nama_asset: string;
  serial_number: string;
  spesifikasi: string;
  tgl_pengadaan: string;
  harga: string;
  deskripsi: string;
  klasifikasi: string;
  lokasi: string;
  status: string;
  pic: Pic[];
}

interface Pic {
  pic_uuid: string;
  nama_pic: string;
  keterangan: string;
}

@Component({
  standalone: true,
    selector: 'app-assets',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ExportAsModule, AvatarModule],
    templateUrl: './assets.component.html',
    styleUrl: './assets.component.css'
})
export class AssetsComponent implements OnInit {
  maxPicCount: number = 0;
  avatarColors: { [key: string]: string } = {};

  // kode_asset: string = ''
  // nama_barang: string = ''
  asset_uuid: string = '';
  kode_asset: string = '';
  nama_asset: string = '';
  serial_number: string = '';
  spesifikasi: string = '';
  tgl_pengadaan: string = '';
  harga: string = '';
  deskripsi: string = '';
  klasifikasi: string = '';
  lokasi: string = '';
  status: string = '';

  // form ba
  pihak_pertama: string = '';
  jabatan_pihak_pertama: string = '';
  nama_pic: string = '';
  jabatan_pic: string = '';
  jenis: string = '';

  signatories = [];
  name1: string = '';
  name2: string = '';
  name3: string = '';
  name4: string = '';

  position1: string = '';
  position2: string = '';
  position3: string = '';
  position4: string = '';

  roleSign1: string = 'Pengaju';
  roleSign2: string = 'Atasan Pengaju';
  roleSign3: string = 'Penerima';
  roleSign4: string = 'Atasan Penerima';

  is_sign: boolean = false;
  is_sign1: boolean = false;
  is_sign2: boolean = false;
  is_sign3: boolean = false;
  is_sign4: boolean = false;

  isSigned: boolean = false;
  signatoryPositions: {
    [key: string]: {
      name: string;
      position: string;
      is_sign: boolean;
      sign_img: string;
    };
  } = {
    Pengaju: { name: '', position: '', is_sign: false, sign_img: '' },
    'Atasan Pengaju': { name: '', position: '', is_sign: false, sign_img: '' },
    Penerima: { name: '', position: '', is_sign: false, sign_img: '' },
    'Atasan Penerima': { name: '', position: '', is_sign: false, sign_img: '' },
  };

  isPreview: boolean = false;

  isModalAddOpen: boolean = false;
  isModalAddBeritaAcaraOpen: boolean = false;
  isModalEditOpen: boolean = false;
  isModalSignOpen: boolean = false;
  isModalApproveOpen: boolean = false;

  constructor(
    private cookieService: CookieService,
    // private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    // public formDaService: FormDaService,
    private datePipe: DatePipe,
    private exportAsService: ExportAsService,
    // private pdfService: PdfGenerationService,
    @Inject('apiUrl') private apiUrl: string
  ) {
    this.apiUrl = apiUrl;
  }

  assets: Assets[] = [];
  PICData: Pic[] = [];
  dataListAllUser: any = [];

  ngOnInit(): void {
    this.fetchAllUser();

    this.fetchDataAsset();
    this.assets.forEach(asset => {
      asset.pic?.forEach(pic => {
        if (!this.avatarColors[pic.nama_pic]) {
          this.avatarColors[pic.nama_pic] = this.getRandomColor();
        }
      });
    });
  }

  formatHarga(harga: string): string {
    // Hapus spasi dan karakter non-numeric lainnya
    const sanitizedHarga = harga.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    const numberHarga = parseFloat(sanitizedHarga);

    // Cek apakah numberHarga valid
    if (isNaN(numberHarga)) {
      return 'Rp0'; // Atau bisa mengembalikan string kosong atau pesan error
    }

    // Format harga tanpa spasi sebelum 'Rp'
    return `Rp${numberHarga.toLocaleString('id-ID', {
      minimumFractionDigits: 0, // Tidak ada desimal
      maximumFractionDigits: 0, // Tidak ada desimal
    })}`;
  }

  // exportToExcel() {
  
  //   const excelConfig: ExportAsConfig = {
  //     type: 'xlsx', // Format file yang diinginkan
  //     elementIdOrContent: 'table', // ID dari elemen tabel yang akan diekspor
  //   };
  
  //   // Mengekspor file
  //   this.exportAsService.save(excelConfig, 'Data List Assets').subscribe(() => {
  //     console.log('Excel berhasil diunduh!');
  //   });
  // }

  // exportToExcel() {
  //   const exportData = this.assets.map(asset => ({
  //     "No.": (asset as any).no || "-", // Pakai `as any` untuk hindari error
  //     "Kode Asset": asset.kode_asset || "-",
  //     "Nama Barang": asset.nama_asset || "-",
  //     "Serial Number": asset.serial_number || "-",
  //     "Spesifikasi": asset.spesifikasi || "-",
  //     "Tgl. Pengadaan": asset.tgl_pengadaan || "-",
  //     "PIC History": this.getAllPicNames(asset), // ✅ Menggunakan function untuk ambil semua PIC
  //     "PIC Terakhir": asset.pic?.length ? asset.pic[asset.pic.length - 1].nama_pic : "Tidak ada PIC",
  //     "Status": asset.status || "-",
  //     "Lokasi": asset.lokasi || "-",
  //     "Harga": asset.harga?.toString() || "-",
  //     "Keterangan": (asset as any).keterangan || "-",
  //     "Klasifikasi Sistem": (asset as any).klasifikasi_sistem || "-"
  //   }));
  
  //   const excelConfig: ExportAsConfig = {
  //     type: 'xlsx',
  //     elementIdOrContent: 'table', // Gunakan ID tabel yang sesuai
  //   };
  
  //   // Mengekspor file
  //   this.exportAsService.save(excelConfig, 'Data List Assets').subscribe(() => {
  //     console.log('Excel berhasil diunduh!');
  //   });
  // }  

  // exportToExcel() {
  //   if (!this.assets.length) {
  //     console.warn("Tidak ada data untuk diekspor!");
  //     return;
  //   }
  
  //   // **1️⃣ Cari jumlah maksimal PIC di seluruh asset**
  //   const maxPicCount = Math.max(...this.assets.map(asset => asset.pic.length), 0);

  //   const headerTemplate = [
  //     ["AINO PAYMENT SOLUTION", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  //     ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  //     ["DAFTAR ASET HARDWARE", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  //     ["No. Dokumen", "AINO/CHC/F/17/10", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  //     ["Tanggal Terbit", "30-Sep-22", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  //     ["No. Revisi", "1.0", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  //     ["Halaman", "1 dari 1", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  //     ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], // Baris kosong sebelum tabel
  //   ];    
  
  //   // **2️⃣ Buat header Excel secara dinamis**
  //   const headers = [
  //     "No.",
  //     "Kode Asset",
  //     "Nama Barang",
  //     "Serial Number",
  //     "Spesifikasi",
  //     "Tgl. Pengadaan",
  //     ...Array.from({ length: maxPicCount }, (_, i) => `PIC ${i + 1}`), // ✅ Tambahkan header PIC 1, PIC 2, dst.
  //     "PIC Terakhir",
  //     "Status",
  //     "Lokasi",
  //     "Harga",
  //     "Keterangan",
  //     "Klasifikasi Sistem"
  //   ];
  
  //   const exportData = this.assets.map((asset, index) => {
  //     const rowData: any = {
  //       "No.": index + 1,
  //       "Kode Asset": asset.kode_asset,
  //       "Nama Barang": asset.nama_asset,
  //       "Serial Number": asset.serial_number,
  //       "Spesifikasi": asset.spesifikasi,
  //       "Tgl. Pengadaan": asset.tgl_pengadaan ? asset.tgl_pengadaan.split("T")[0] : "-",
  //       // "PIC Terakhir": asset.pic.length ? asset.pic[asset.pic.length - 1].nama_pic : "Tidak ada PIC",
  //       "Status": asset.status,
  //       "Lokasi": asset.lokasi,
  //       "Harga": asset.harga?.toString(),
  //       "Keterangan": asset.deskripsi,
  //       // "Keterangan": asset.pic.length 
  //       // ? asset.pic.map(p => p.keterangan || "-").join(', ') 
  //       // : "-",
  //       "Klasifikasi Sistem": asset.klasifikasi
  //     };

  //     console.log("Data PIC:", asset.pic);
  //     console.log("Keterangan hasil mapping:", asset.pic.map(p => p.keterangan || "-"));

  
  //     // **3️⃣ Tambahkan PIC secara dinamis**
  //     asset.pic.forEach((pic, i) => {
  //       rowData[`PIC ${i + 1}`] = pic.nama_pic;
  //     });
  
  //     // **4️⃣ Pastikan semua baris memiliki jumlah kolom yang sama**
  //     for (let i = asset.pic.length; i < maxPicCount; i++) {
  //       rowData[`PIC ${i + 1}`] = "-";
  //     }
  
  //     // **5️⃣ Tambahkan "PIC Terakhir"**
  //     rowData["PIC Terakhir"] = asset.pic.length ? asset.pic[asset.pic.length - 1].nama_pic : "Tidak ada PIC";
  
  //     return rowData;
  //   });
  
  //   console.log("Data yang akan diekspor:", exportData); // Debugging
  
  //   // **6️⃣ Konversi JSON ke Worksheet**
  //   const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  //   // const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet([
  //   //   ...headerTemplate, // Header dokumen
  //   //   headers,           // Header kolom
  //   //   ...exportData.map(Object.values) // Data aset
  //   // ]);
  //   const wb: XLSX.WorkBook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, "Assets");
  
  //   // **7️⃣ Simpan sebagai file Excel**
  //   XLSX.writeFile(wb, "Data_List_Assets.xlsx");
  // }    

  exportToExcel() {
    if (!this.assets.length) {
      console.warn("Tidak ada data untuk diekspor!");
      return;
    }
  
    // **1️⃣ Cari jumlah maksimal PIC di seluruh aset**
    const maxPicCount = Math.max(...this.assets.map(asset => asset.pic?.length || 0), 0);
  
    // **2️⃣ Buat header Excel dengan urutan yang benar**
    const headers = [
      "No.",
      "Kode Asset",
      "Nama Barang",
      "Serial Number",
      "Spesifikasi",
      "Tgl. Pengadaan",
      ...Array.from({ length: maxPicCount }, (_, i) => `PIC ${i + 1}`), // ✅ PIC 1, PIC 2, ...
      "PIC Terakhir", // ✅ PIC terakhir setelah PIC history
      "Status",
      "Lokasi",
      "Harga",
      "Keterangan",
      "Klasifikasi Sistem"
    ];
  
    const exportData = this.assets.map((asset, index) => {
      const rowData: any = {
        "No.": index + 1,
        "Kode Asset": asset.kode_asset || "-",
        "Nama Barang": asset.nama_asset || "-",
        "Serial Number": asset.serial_number || "-",
        "Spesifikasi": asset.spesifikasi || "-",
        "Tgl. Pengadaan": asset.tgl_pengadaan ? asset.tgl_pengadaan.split("T")[0] : "-"
      };
  
      // **3️⃣ Tambahkan PIC secara dinamis sesuai jumlah maksimal PIC**
      asset.pic?.forEach((pic, i) => {
        rowData[`PIC ${i + 1}`] = pic.nama_pic || "-";
      });
  
      // **4️⃣ Pastikan semua baris memiliki jumlah kolom yang sama**
      for (let i = asset.pic?.length || 0; i < maxPicCount; i++) {
        rowData[`PIC ${i + 1}`] = "-";
      }
  
      // **5️⃣ Tambahkan "PIC Terakhir" setelah daftar PIC**
      rowData["PIC Terakhir"] = asset.pic?.length ? asset.pic[asset.pic.length - 1].nama_pic || "-" : "Tidak ada PIC";
  
      // **6️⃣ Tambahkan data lainnya setelah PIC Terakhir**
      rowData["Status"] = asset.status || "-";
      rowData["Lokasi"] = asset.lokasi || "-";
      rowData["Harga"] = asset.harga?.toString() || "-";
      rowData["Keterangan"] = asset.deskripsi || "-";
      rowData["Klasifikasi Sistem"] = asset.klasifikasi || "-";
  
      return rowData;
    });
  
    console.log("Data yang akan diekspor:", exportData); // Debugging
  
    // **7️⃣ Konversi JSON ke Worksheet dengan header yang benar**
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData, { header: headers });
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets");
  
    // **8️⃣ Simpan sebagai file Excel**
    XLSX.writeFile(wb, "Data_List_Assets.xlsx");
  }  
  
  getAllPicNames(asset: Assets): string {
    return asset.pic?.map(pic => pic.nama_pic).join(', ') || '-';
  }
  

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

  handleKeyDown(event: KeyboardEvent) {
    console.log(`Key pressed: ${event.key}`); // Debug output
    if (event.key === 'Escape') {
      this.closeAddModal();
      // this.closeEditModal();
      // this.closeSignModal();
      console.log('Modals closed');
    }
  }

  infoHAForm: FormGroup = new FormGroup({
    data_info_ha: new FormArray([]),
  });

  getInfoHAField(): FormGroup {
    return new FormGroup({
      nama_pic: new FormControl('', Validators.required),
      keterangan: new FormControl('', Validators.required),
    });
  }

  getInfoHAFieldsValue() {
    return this.infoHAListArray().controls.map((control) => control.value);
  }

  infoHAListArray() {
    return this.infoHAForm.get('data_info_ha') as FormArray;
  }

  addInfoHAField() {
    this.infoHAListArray().push(this.getInfoHAField());
    console.log('halo');
  }

  removeInfoHAField(i: number) {
    this.infoHAListArray().removeAt(i);
  }

  data() {
    console.log(this.infoHAForm.value);
  }

  fetchDataAsset() {
    axios
      .get(`${environment.apiUrl2}/assets`)
      .then((response) => {
        this.assets = response.data; // Simpan data ke dalam variabel assets
        console.log('asset', this.assets);

        // Cek apakah this.assets valid dan tidak null sebelum memanggil map
        if (this.assets && Array.isArray(this.assets)) {
          // Cari jumlah PIC maksimum
          this.maxPicCount = Math.max(
            ...this.assets.map((asset) => (asset.pic ? asset.pic.length : 0)) // Periksa apakah asset.pic ada
          );
          console.log('Max PIC count:', this.maxPicCount);
        } else {
          console.warn('No assets available or data is not an array.');
          this.maxPicCount = 0; // Atur maxPicCount ke 0 jika tidak ada data
        }
      })
      .catch((error) => {
        if (error.response) {
          console.error('Error:', error.response.data);
        } else {
          console.error('Error:', error.message);
        }
      });
  }

  fetchAllUser() {
    axios
      .get(`${this.apiUrl}/personal/name/all`)
      .then((response) => {
        this.dataListAllUser = response.data;
        this.cd.detectChanges();
      })
      .catch((error) => {
        console.log(error.response.data.message);
      });
  }

  openTab = 1;
  toggleTabs($tabNumber: number) {
    this.openTab = $tabNumber;
  }

  getRandomColor(): string {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  }

  getRemainingPicNames(pics: any[]): string {
    return pics.slice(2).map(pic => pic.nama_pic).join(', ') || '-';
  }  

  openAddModal() {
    this.isModalAddOpen = true;

    const infoHAArray = this.infoHAListArray();
    infoHAArray.clear();

    this.addInfoHAField();

    this.cd.detectChanges();
  }

  closeAddModal() {
    this.isModalAddOpen = false;
  }

  addAsset() {
    const harga = this.harga.toString().replace(/[^0-9]/g, '');

    let dataPic = this.getInfoHAFieldsValue();

    if (dataPic.length === 0) {
      dataPic = [
        {
          nama_pic: 'kok ga diisi?? 😔😔',
          keterangan: 'Kalo ga diisi error plisss',
        },
      ];
    }

    // const postData = {
    //   assetData: {
    //     kode: this.kode_asset,
    //     nama: this.nama_asset,
    //     serial_number: this.serial_number,
    //     spesifikasi: this.spesifikasi,
    //     tgl_pengadaan: this.tgl_pengadaan,
    //     harga: harga,
    //     deskripsi: this.deskripsi,
    //     klasifikasi: this.klasifikasi,
    //     lokasi: this.lokasi,
    //     status: this.status,
    //   },
    //   data_pic: this.getInfoHAFieldsValue(),
    // };

    // console.log('asset nij', postData);

    axios
      .post(
        `${environment.apiUrl2}/api/add/asset`,
        {
          assetData: {
            // kode_asset: this.kode_asset,
            nama_asset: this.nama_asset,
            serial_number: this.serial_number,
            spesifikasi: this.spesifikasi,
            tgl_pengadaan: this.tgl_pengadaan || new Date().toISOString(),
            harga: harga,
            deskripsi: this.deskripsi,
            klasifikasi: this.klasifikasi,
            lokasi: this.lokasi,
            status: this.status,
          },
          data_pic: dataPic,
        },
        // postData,
        {
          headers: {
            Authorization: `Bearer ${this.cookieService.get('userToken')}`,
          },
        }
      )
      .then((response) => {
        console.log('Response:', response);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: response.data.message,
          timer: 2000,
          timerProgressBar: true,
          showCancelButton: false,
          showConfirmButton: false,
        });

        this.fetchDataAsset();
      })
      .catch((error) => {
        if (
          error.response.status === 500 ||
          error.response.status === 400 ||
          error.response.status === 422 ||
          error.response.status === 404
        ) {
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
    this.isModalAddOpen = false;
  }

  openAddBeritaAcaraModal(
    asset_uuid: string,
    kode_asset: string,
    type: string
  ) {
    console.log('uuid', asset_uuid);
    console.log('kode', kode_asset);
    console.log('jenis', type);

    this.asset_uuid = asset_uuid;
    this.jenis = type;
    this.pihak_pertama = '';
    this.nama_pic = '';
    this.jabatan_pic = '';
    this.kode_asset = kode_asset;

    this.isModalAddBeritaAcaraOpen = true;
  }

  closeAddBeritaAcaraModal() {
    this.isModalAddBeritaAcaraOpen = false;
  }

  addBeritaAcara() {
    const postData = {
      isPublished: false,
      formData: {
        document_uuid: 'f97b1dbe-0366-4ec5-aeff-bdf1f288e347',
        form_ticket: '1', // gatau butuh ini atau ga
      },
      beritaAcara: {
        asset_uuid: this.asset_uuid,
        jenis: this.jenis,
        pihak_pertama: this.pihak_pertama,
        jabatan_pihak_pertama: this.jabatan_pihak_pertama,
        nama_pic: this.nama_pic,
        jabatan_pic: this.jabatan_pic,
        kode_asset: this.kode_asset,
      },
      signatories: [
        {
          name: 'this.name1',
          position: 'this.position1',
          role_sign: 'this.roleSign1',
        },
      ],
    };

    console.log('asset nij', postData);

    axios
      .post(
        `${environment.apiUrl2}/api/add/ba/asset`,
        // {
        //   assetData: {
        //     // kode_asset: this.kode_asset,
        //     nama_asset: this.nama_asset,
        //     serial_number: this.serial_number,
        //     spesifikasi: this.spesifikasi,
        //     tgl_pengadaan: this.tgl_pengadaan || new Date().toISOString(),
        //     harga: harga,
        //     deskripsi: this.deskripsi,
        //     klasifikasi: this.klasifikasi,
        //     lokasi: this.lokasi,
        //     status: this.status,
        //   },
        //   data_pic: dataPic,
        // },
        postData,
        {
          headers: {
            Authorization: `Bearer ${this.cookieService.get('userToken')}`,
          },
        }
      )
      .then((response) => {
        console.log('Response:', response);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: response.data.message,
          timer: 2000,
          timerProgressBar: true,
          showCancelButton: false,
          showConfirmButton: false,
        });
        this.fetchDataAsset();
      })
      .catch((error) => {
        if (
          error.response.status === 500 ||
          error.response.status === 400 ||
          error.response.status === 422 ||
          error.response.status === 404
        ) {
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
      this.isModalAddBeritaAcaraOpen = false;
  }

  openEditModal(form_uuid: string) {
    axios
      .get(`${environment.apiUrl2}/asset/${form_uuid}`)
      .then((response) => {
        console.log('plis coy', response.data);

        this.isModalEditOpen = true;
        const formData = response.data.asset;

        this.kode_asset = formData.kode_asset;
        this.asset_uuid = formData.asset_uuid;
        this.nama_asset = formData.nama_asset;
        this.serial_number = formData.serial_number;
        this.spesifikasi = formData.spesifikasi;
        this.tgl_pengadaan = formData.tgl_pengadaan;
        this.harga = this.formatHarga(formData.harga);
        this.deskripsi = formData.deskripsi;
        this.klasifikasi = formData.klasifikasi;
        this.lokasi = formData.lokasi;
        this.status = formData.status;

        const infoHAArray = this.infoHAListArray();
        infoHAArray.clear(); // Clear existing fields before adding new ones

        response.data.pic.forEach((data: any) => {
          infoHAArray.push(
            new FormGroup({
              nama_pic: new FormControl(
                data.nama_pic || '',
                Validators.required
              ),
              keterangan: new FormControl(
                data.keterangan || '',
                Validators.required
              ),
            })
          );
        });
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

  closeEditModal() {
    this.isModalEditOpen = false;
  }

  updateFormHA() {
    const harga = this.harga.toString().replace(/[^0-9]/g, '');
    this.PICData = this.infoHAListArray().getRawValue();

    const data = {
      assetData: {
        asset_uuid: this.asset_uuid,
        nama_asset: this.nama_asset,
        serial_number: this.serial_number,
        spesifikasi: this.spesifikasi,
        tgl_pengadaan: this.tgl_pengadaan,
        harga: harga,
        deskripsi: this.deskripsi,
        klasifikasi: this.klasifikasi,
        lokasi: this.lokasi,
        status: this.status,
      },
      data_pic: this.PICData.map((info) => ({
        nama_pic: info.nama_pic,
        keterangan: info.keterangan,
      })),
    };

    // console.log('update', data);
    axios
      .put(`${environment.apiUrl2}/api/asset/update/${this.asset_uuid}`, data, {
        headers: {
          Authorization: `Bearer ${this.cookieService.get('userToken')}`,
        },
      })
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
        this.fetchDataAsset();
        // this.fetchDataFormHA();
        // this.fetchDataAdminFormHA();
        // this.fetchDataUserFormHA();
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
    this.isModalEditOpen = false;
  }

  onDeleteAsset(asset_uuid: string) {
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
        this.performDeleteAsset(asset_uuid);
      }
    });
  }

  performDeleteAsset(asset_uuid: string) {
    axios
      .put(
        `${environment.apiUrl2}/api/asset/delete/${asset_uuid}`,
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
        this.fetchDataAsset();
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

  
}
