import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtdEditorComponent } from './index';
import { PepUIModule } from 'src/app/modules/pepperi.module';
import { TranslateService, TranslateModule, TranslateLoader, TranslateStore } from '@ngx-translate/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PepFileService, PepAddonService, PepHttpService, PepCustomizationService, PepNgxLibModule, PepLayoutService } from '@pepperi-addons/ngx-lib';
import { FieldFormComponent } from '../field-form/field-form.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule } from '@angular/forms';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';

import { AddonService } from 'src/app/services/addon.service';
import { RelatedItemsService } from 'src/app/services/related-items.service';
import { DialogService } from 'src/app/services/dialog.service';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { FeatureModule } from 'src/app/modules/shared.module';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';

@NgModule({
  declarations: [
    AtdEditorComponent,
    FieldFormComponent
  ],
  imports: [
    CommonModule,
    PepUIModule,
    MatDialogModule,
    HttpClientModule,
    FeatureModule,
    MaterialModule,
    PepPageLayoutModule,
    PepNgxLibModule,
    PepSelectModule,
    PepTextboxModule,
    MatDialogModule,
    TranslateModule.forChild({

      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient, fileService: PepFileService, addonService: PepAddonService) =>
          PepAddonService.createDefaultMultiTranslateLoader(http, fileService, addonService, "4f9f10f3-cd7d-43f8-b969-5029dad9d02b"),
        deps: [HttpClient, PepFileService, PepAddonService],

      }, isolate: false

    }),
    FormsModule
  ],

  exports: [AtdEditorComponent],
  providers: [
    HttpClient,
    TranslateStore,
    PepHttpService,
    AddonService,
    PepAddonService,
    PepFileService,
    PepCustomizationService,
    PepDialogService,
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
