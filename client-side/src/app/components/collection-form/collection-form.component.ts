import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Component, OnInit } from "@angular/core";
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
//import { AddonService } from '../../services/addon.service';
import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { GenericListDataSource } from '../generic-list/generic-list.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'addon-collection-form',
  templateUrl: './collection-form.component.html',
  styleUrls: ['./collection-form.component.scss']
})
export class CollectionForm implements OnInit {

  screenSize: PepScreenSizeType;

  constructor(
    public layoutService: PepLayoutService,
    public translate: TranslateService,
    public dialogService: PepDialogService,
    public router: Router,
    public activatedRoute: ActivatedRoute
  ) {

    this.layoutService.onResize$.subscribe(size => {
      this.screenSize = size;
    });

  }

  ngOnInit() {
  }

  goBack() {
    this.router.navigate(['..'], {
      relativeTo: this.activatedRoute,
      queryParamsHandling: 'preserve'
    })
  }

  backClicked() {
    this.goBack();
  }

  saveClicked() {
  }

  cancelClicked() {
    this.dialogService.openDefaultDialog(new PepDialogData({
      title: 'Are you sure?',
      actionButtons: [
        {
          title: this.translate.instant('No'),
          className: 'regular',
          callback: () => {
            this.goBack()
          }
        },
        {
          title: this.translate.instant('Yes'),
          className: 'strong',
          callback: () => {
            this.goBack()
          }
        }
      ]
    }))
  }

}
