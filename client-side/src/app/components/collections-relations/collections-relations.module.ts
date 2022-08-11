import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepTextareaModule } from '@pepperi-addons/ngx-lib/textarea';
import { PepImageModule } from '@pepperi-addons/ngx-lib/image';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';

import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { PepNgxCompositeLibModule } from '@pepperi-addons/ngx-composite-lib';

import { RelatedCollectionsComponent } from './collections-relations.component';
import { ItemSelectionComponent } from '../item-selection/item-selection.component';
import { RelatedCollectionFormComponent } from '../related-collection-form/related-collection-form.component';

import { DialogService } from '../../services/dialog.service';
import { RelatedItemsService } from '../../services/related-items.service';

import { config } from '../../addon.config';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
    declarations: [
        RelatedCollectionsComponent,
        ItemSelectionComponent,
        RelatedCollectionFormComponent
    ],
    imports: [
        CommonModule,
        PepPageLayoutModule,
        PepGenericListModule,
        PepButtonModule,
        PepTextboxModule,
        PepTextareaModule,
        PepMenuModule,
        PepDialogModule,
        PepImageModule,
        PepTopBarModule,
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
export class CollectionsRelationsModule {
    constructor(
        translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
