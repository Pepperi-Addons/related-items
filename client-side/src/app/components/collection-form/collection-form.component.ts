import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
//import { AddonService } from '../../services/addon.service';
import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PepCustomizationService, PepLoaderService, PepStyleType } from '@pepperi-addons/ngx-lib';
import { Collection } from '../../../../../shared/entities';
import { BehaviorSubject } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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

  constructor(
    public layoutService: PepLayoutService,
    public translate: TranslateService,
    public dialogService: PepDialogService,
    public route: ActivatedRoute,
    public router: Router,
    public loaderService: PepLoaderService,
    public dialogRef: MatDialogRef<CollectionForm>,
    @Inject(MAT_DIALOG_DATA) public incoming: any
  ) {

    this.layoutService.onResize$.subscribe(size => {
      this.screenSize = size;
    });
    this.dialogData = incoming.data;
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
