import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { MatDialogModule } from '@angular/material/dialog';

import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepTextareaModule } from '@pepperi-addons/ngx-lib/textarea';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';

import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { PepNgxCompositeLibModule } from '@pepperi-addons/ngx-composite-lib';

import { CollectionsListComponent } from './collections-list.component';
import { CollectionForm } from '../collection-form/collection-form.component';

import { DialogService } from '../../services/dialog.service';
import { RelatedItemsService } from '../../services/related-items.service';

import { config } from '../../addon.config';

@NgModule({
    declarations: [
        CollectionsListComponent,
        CollectionForm
    ],
    imports: [
        CommonModule,
        PepPageLayoutModule,
        PepTopBarModule,
        PepGenericListModule,
        PepButtonModule,
        PepTextboxModule,
        PepTextareaModule,
        PepMenuModule,
        PepDialogModule,
        PepNgxCompositeLibModule,
        MatDialogModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }, isolate: false
        }),
    ],
    providers: [
        TranslateStore,
        DialogService,
        RelatedItemsService
    ]
})
export class CollectionsListModule {
    constructor(
        translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
