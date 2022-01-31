import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'addon-message-dialog',
  templateUrl: './message-dialog.component.html',
  styleUrls: ['./message-dialog.component.scss']
})
export class MessageDialogComponent implements OnInit {

  errorMessage: any;

  constructor(
      public dialogRef: MatDialogRef<MessageDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public incoming: any,
      translate: TranslateService
  ) {
      
    this.errorMessage = translate.instant(incoming.data);
   }

  ngOnInit() {
  }

}
