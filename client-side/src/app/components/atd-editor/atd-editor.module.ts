import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtdEditorComponent } from './index';
import { TranslateService, TranslateModule, TranslateLoader, TranslateStore } from '@ngx-translate/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PepFileService, PepAddonService, PepHttpService, PepCustomizationService, PepNgxLibModule } from '@pepperi-addons/ngx-lib';
import { FieldFormComponent } from '../field-form/field-form.component';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { PepDialogModule, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepNgxCompositeLibModule } from '@pepperi-addons/ngx-composite-lib';
import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';

import { DialogService } from '../../services/dialog.service';
import { AddonService } from '../../services/addon.service';
import { RelatedItemsService } from '../../services/related-items.service';
import { config } from '../../addon.config';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { MatRadioModule } from '@angular/material/radio';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';


@NgModule({
  declarations: [
    AtdEditorComponent,
    FieldFormComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    MatDialogModule,
    HttpClientModule,
    PepPageLayoutModule,
    PepNgxLibModule,
    PepSelectModule,
    PepTextboxModule,
    PepDialogModule,
    PepSelectModule,
    PepButtonModule,
    MatRadioModule,
    PepNgxCompositeLibModule,
    PepGenericListModule,
    TranslateModule.forChild({

      loader: {
        provide: TranslateLoader,
        useFactory: (addonService: PepAddonService) =>
          PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService,['ngx-lib', 'ngx-composite-lib']),
        deps: [PepAddonService],

      }, isolate: false

    }),
    FormsModule
  ],

  exports: [AtdEditorComponent],
  providers: [
    HttpClient,
    TranslateStore,
    AddonService,
    RelatedItemsService,
    DialogService
  ]
})
export class AtdEditorModule {
  constructor(
    translate: TranslateService,
    private addonService: PepAddonService
  ) {
    this.addonService.setDefaultTranslateLang(translate);
  }
}
