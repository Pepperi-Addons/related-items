import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';

import { PepAddonService } from '@pepperi-addons/ngx-lib';

import { SettingsComponent } from './index';
import { SettingsRoutingModule } from './settings.routes';
import { config } from '../../addon.config';
import { CollectionsListModule } from '../collections/collections-list.module';
import { CollectionsRelationsModule } from '../collections-relations/collections-relations.module';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
    declarations: [
        SettingsComponent,
        MessageDialogComponent
    ],
    imports: [
        SettingsRoutingModule,
        CommonModule,
        CollectionsListModule,
        CollectionsRelationsModule,
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
})
export class SettingsModule {
    constructor(
        translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
