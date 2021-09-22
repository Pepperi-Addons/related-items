import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { Router } from '@angular/router';
import { Collection } from '../../../../../server-side/entities';
import { BehaviorSubject } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddonService } from '../../services/addon.service';

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
  shouldShowNameField: boolean = true;

  constructor(
      public layoutService: PepLayoutService,
      public addonService: AddonService,
      public translate: TranslateService,
      public dialogService: PepDialogService,
      public router: Router,
      public dialogRef: MatDialogRef<CollectionForm>,
      @Inject(MAT_DIALOG_DATA) public incoming: any
  ) {

    this.layoutService.onResize$.subscribe(size => {
      this.screenSize = size;
    });
    this.dialogData = incoming.data;
    this.shouldShowNameField = this.dialogData.shouldShowNameField;
    if (incoming.data.collectionObj) {
      let current: Collection = incoming.data.collectionObj;
      this.dialogData.Name = current.Name;
      this.dialogData.Description = current.Description;
    }
  }

  ngOnInit() {
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
  }
}
