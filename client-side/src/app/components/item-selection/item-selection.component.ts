import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog.service';
import { RelatedItemsService } from '../../services/related-items.service';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';

@Component({
  selector: 'addon-item-selection',
  templateUrl: './item-selection.component.html',
  styleUrls: ['./item-selection.component.scss']
})
export class ItemSelectionComponent implements OnInit {

  dialogData: any;
  itemsInCollection = [];
  allItems = [];
  externalID: string;
  dialogTitle: string = `Add Item`;

  constructor(
      public relatedItemsService: RelatedItemsService,
      private dialogService: DialogService,
      public dialogRef: MatDialogRef<ItemSelectionComponent>,
      @Inject(MAT_DIALOG_DATA) public incoming: any
    ) {

    this.dialogData = incoming.data;
    this.dialogData.ItemExternalID = '';
    this.itemsInCollection = this.dialogData.ItemsList.map(item => {return item.ItemExternalID});
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
