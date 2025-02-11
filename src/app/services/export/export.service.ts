import { Injectable } from '@angular/core';
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor(private exportAsService: ExportAsService) {}

  exportToPdf(elementId: string, filename: string) {
    const config: ExportAsConfig = {
      type: 'pdf',
      elementIdOrContent: elementId,
    };

    this.exportAsService.save(config, filename); // No need for `subscribe` here
  }

  // Optional: If you want to get the content as base64 or JSON
  getExportContent(config: ExportAsConfig) {
    return this.exportAsService.get(config); // You can subscribe to this
  }
}
