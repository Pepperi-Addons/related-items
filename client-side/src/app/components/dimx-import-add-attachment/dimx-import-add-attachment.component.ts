import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'addon-dimx-import-add-attachment',
  templateUrl: './dimx-import-add-attachment.component.html',
  styleUrls: ['./dimx-import-add-attachment.component.scss']
})
export class DimxImportAddAttachmentComponent implements OnInit {

  dialogData: any;

  constructor(private dialogRef: MatDialogRef<DimxImportAddAttachmentComponent>,
    @Inject(MAT_DIALOG_DATA) public incoming: any) {
      this.dialogData = incoming;
     }

  ngOnInit() {
  }

  onFileSelect($event) {
    debugger
    let fileObj = $event.fileStr;
    if (fileObj.length > 0) {
      debugger

      //this.dialogData.fileToImport = reader;
    }
  }

  onCloseButtonClicked() {
    this.dialogRef.close();
  }

  onImportButtonClicked(){
    if (this.dialogData.fileToImport != '') {
      this.dialogRef.close(this.dialogData);
    }
    //TODO: add error
    else {
      
    }
  }
}
