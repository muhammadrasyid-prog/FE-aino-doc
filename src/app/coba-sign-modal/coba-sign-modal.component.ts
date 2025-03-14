import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import SignaturePad from 'signature_pad';

@Component({
  standalone: true,
    selector: 'app-coba-sign-modal',
    imports: [CommonModule],
    templateUrl: './coba-sign-modal.component.html',
    styleUrls: ['./coba-sign-modal.component.css']
})
export class CobaSignModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sigPad', { static: false }) sigPad!: ElementRef<HTMLCanvasElement>;
  private signaturePad!: SignaturePad;
  img: string | null = null;
  penColor: string = '#262626'; // Default pen color  

  ngAfterViewInit() {
    const canvas = this.sigPad.nativeElement;
    
    // Inisialisasi SignaturePad
    this.signaturePad = new SignaturePad(canvas);

    if (this.signaturePad) {
        console.log("SignaturePad initialized:", this.signaturePad); // Debug: Cek apakah SignaturePad terinisialisasi
    }

    // Set warna pena awal
    this.signaturePad.penColor = this.penColor;

    // Resize canvas agar sesuai dengan container
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));

    // Tambahkan event listener untuk menangkap event penulisan di canvas
    canvas.addEventListener('mousedown', () => {
        console.log('Mulai menulis di canvas');
    });

    canvas.addEventListener('mouseup', () => {
        console.log('Selesai menulis di canvas');
    });

    // Untuk touch event (di perangkat layar sentuh)
    canvas.addEventListener('touchstart', () => {
        console.log('Mulai menulis di canvas (touch event)');
    });

    canvas.addEventListener('touchend', () => {
        console.log('Selesai menulis di canvas (touch event)');
    });
}


  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
  }

  clear() {
    this.signaturePad.clear();
    this.img = null; // Clear the img property when the canvas is cleared
  }

  save() {
    const dataURL = this.sigPad.nativeElement.toDataURL("image/png");
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'signature.png';
    link.click();
  }

  
  // save() {
  //   this.img = this.signaturePad.toDataURL('image/png');
  //   console.log(this.img);
  // }

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
}
