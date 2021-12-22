import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog.service';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'addon-item-selection',
  templateUrl: './item-selection.component.html',
  styleUrls: ['./item-selection.component.scss']
})
export class ItemSelectionComponent implements OnInit {

  dialogData: any;
  allItems = [];
  externalID: string;
  dialogTitle: string = this.translate.instant("Add_Item_Title");

  constructor(
      private translate: TranslateService,
      private dialogService: DialogService,
      public dialogRef: MatDialogRef<ItemSelectionComponent>,
      @Inject(MAT_DIALOG_DATA) public incoming: any
    ) {

    this.dialogData = incoming.data;
    this.dialogData.ItemExternalID = '';
    this.dialogTitle = this.dialogData.Title;
  }

  ngOnInit() {
  }

  onValueChanged(element, $event) {
    switch (element) {
      case 'ExternalID': {
        this.dialogData.ItemExternalID = $event;
        break;
      }
    }
  }

  async onSaveButtonClicked() {
    if (this.dialogData.ItemExternalID) {
      this.dialogRef.close(this.dialogData);
    }
    else {
      let errorMessage = `External ID is mandatory`;
      this.dialogService.openDialog("", MessageDialogComponent, [], { data: errorMessage });
    }
  }
}
