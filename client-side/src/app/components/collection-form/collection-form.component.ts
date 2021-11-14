import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { Collection } from '../../../../../shared/entities';
import { BehaviorSubject } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import { DialogService } from '../../services/dialog.service';

export class CollectionFormDialogService {

  private dataSource = new BehaviorSubject<any>('');
  data = this.dataSource.asObservable();

  constructor() { }

  getData(data: any) {
    this.dataSource.next(data);
  }

}

@Component({
  selector: 'addon-collection-form',
  templateUrl: './collection-form.component.html',
  styleUrls: ['./collection-form.component.scss']
})
export class CollectionForm implements OnInit, OnDestroy {

  screenSize: PepScreenSizeType;
  dialogData: any;
  isAddMode: boolean = true;
  title: string = 'Add collection';
  rightButtonTitle = 'Save';

  constructor(
      public layoutService: PepLayoutService,
      public translate: TranslateService,
      public dialogRef: MatDialogRef<CollectionForm>,
      private dialogService: DialogService,
      @Inject(MAT_DIALOG_DATA) public incoming: any
  ) {

    this.layoutService.onResize$.subscribe(size => {
      this.screenSize = size;
    });
    this.dialogData = incoming.data;
    this.isAddMode = this.dialogData.shouldShowNameField;
    if (incoming.data.collectionObj) {
      let current: Collection = incoming.data.collectionObj;
      this.dialogData.Name = current.Name;
      this.dialogData.Description = current.Description;
    }
  }

  ngOnInit() {
    if (!this.isAddMode) {
      this.title = 'Edit collection';
      this.rightButtonTitle = "Update";
    }
  }

  ngOnDestroy() {
    this.dialogData = null;
  }

  onValueChanged(element, $event) {
    switch (element) {
      case 'Name': {
        this.dialogData.Name = $event;
        break;
      }
      case 'Description': {
        this.dialogData.Description = $event;
        break;
      }
    }
  }

  onSaveButtonClicked() {
    if (this.dialogData.Name && this.dialogData.Description) {
      this.dialogRef.close(this.dialogData);
    }
    else {
      let errorMessage = `Please fill in all mandatory fields.`;
      this.dialogService.openDialog("", MessageDialogComponent, [], { data: errorMessage }, ()=>{});
    }
  }
}
