import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'addon-message-dialog',
  templateUrl: './message-dialog.component.html',
  styleUrls: ['./message-dialog.component.scss']
})
export class MessageDialogComponent implements OnInit {

  errorMessage: any;

  constructor(
      public dialogRef: MatDialogRef<MessageDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public incoming: any
  ) {
      
    this.errorMessage = incoming.data;
   }

  ngOnInit() {
  }

}
