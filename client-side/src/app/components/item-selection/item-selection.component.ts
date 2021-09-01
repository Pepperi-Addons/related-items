import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'addon-item-selection',
  templateUrl: './item-selection.component.html',
  styleUrls: ['./item-selection.component.scss']
})
export class ItemSelectionComponent implements OnInit {

  dialogData: any;
  itemsInCollection = [];

  constructor(public dialogRef: MatDialogRef<ItemSelectionComponent>,
    @Inject(MAT_DIALOG_DATA) public incoming: any) {
    this.dialogData = incoming.data;
    this.dialogData.ItemExternalID = '';
    this.itemsInCollection = this.dialogData.itemsList;
  }

  ngOnInit() {
  }
  onValueChanged(element, $event) {
    switch (element) {
      case 'ExternalID': {
        this.dialogData.itemExternalID = $event;
        break;
      }
    }
  }

  onSaveButtonClicked() {
    if (this.dialogData.itemExternalID) {
      if (this.itemsInCollection.indexOf(this.dialogData.itemExternalID) != -1) {
        
        this.dialogRef.close(this.dialogData);
      }
      else {
        //Noam : Add error 'Already exist external ID in collection'
      }
    }
    else {
      //Noam : Add error 'missing external ID'
    }
  }

}
