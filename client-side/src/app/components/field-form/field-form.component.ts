import { Component, OnInit, Inject } from '@angular/core';
import { DialogService } from 'src/app/services/dialog.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'addon-field-form',
  templateUrl: './field-form.component.html',
  styleUrls: ['./field-form.component.scss']
})
export class FieldFormComponent implements OnInit {

  dialogData: any;

  constructor(
    private dialogService: DialogService,
    public dialogRef: MatDialogRef<FieldFormComponent>,
    @Inject(MAT_DIALOG_DATA) public incoming: any
  ) { 
    this.dialogData = incoming.data;
  }

  ngOnInit() {
  }

  onValueChanged($event) {}

  onSaveButtonClicked() {}

}
