import { DoBootstrap, Injector, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateLoader, TranslateService, TranslateStore } from '@ngx-translate/core';

import { PepAddonService, PepNgxLibModule } from '@pepperi-addons/ngx-lib';
import { PepSizeDetectorModule } from '@pepperi-addons/ngx-lib/size-detector';

import { CollectionsListModule } from './components/collections/collections-list.module';
import { CollectionsRelationsModule } from './components/collections-relations/collections-relations.module';
import { SettingsComponent } from './components/settings';
import { AtdEditorComponent } from './components/atd-editor/atd-editor.component';
import { AppRoutingModule } from './app.routes';
import { AppComponent } from './app.component';
import { config } from './addon.config';

@NgModule({
    declarations: [
        AppComponent,
        ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        CommonModule,
        HttpClientModule,
        CollectionsListModule,
        CollectionsRelationsModule,
        AppRoutingModule,
        PepNgxLibModule,
        PepSizeDetectorModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) =>
                  PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService,['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService],
        
              }
        })

    ],
    providers: [
        TranslateStore,
    ],
    bootstrap: [
        //AppComponent
    ]
})

export class AppModule implements DoBootstrap {
    constructor(
        private injector: Injector,
        translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
    
    ngDoBootstrap() {
        this.pepAddonService.defineCustomElement(`settings-element-${config.AddonUUID}`, SettingsComponent, this.injector);
        this.pepAddonService.defineCustomElement(`atd-editor-element-${config.AddonUUID}`, AtdEditorComponent, this.injector);
    }
}




