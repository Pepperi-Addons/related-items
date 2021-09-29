import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app.routes';
import { AppComponent } from './app.component';
import { MatIconModule } from '@angular/material/icon';
import { PepIconModule } from '@pepperi-addons/ngx-lib/icon';
import { PepSizeDetectorModule } from '@pepperi-addons/ngx-lib/size-detector';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { PepFileService, PepAddonService } from '@pepperi-addons/ngx-lib';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepImageModule } from '@pepperi-addons/ngx-lib/image';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { GenericListComponent } from '../app/components/generic-list/generic-list.component'
import { PepListModule } from '@pepperi-addons/ngx-lib/list';
import { PepSearchModule } from '@pepperi-addons/ngx-lib/search';
import { MatDialogModule } from '@angular/material/dialog';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepDateModule } from '@pepperi-addons/ngx-lib/date';
import { CollectionsListComponent } from './components/collections/collections-list.component';
import { CollectionForm } from './components/collection-form/collection-form.component';
import { RelatedCollections } from './components/collections-relations/collections-relations.component';
import { RelatedCollectionFormComponent } from './components/related-collection-form/related-collection-form.component';
import { ItemSelectionComponent } from './components/item-selection/item-selection.component';
import { MessageDialogComponent } from './components/message-dialog/message-dialog.component';
import { PepTextareaModule } from '@pepperi-addons/ngx-lib/textarea';

export function createTranslateLoader(http: HttpClient, fileService: PepFileService, addonService: PepAddonService) {
    const translationsPath: string = fileService.getAssetsTranslationsPath();
    const translationsSuffix: string = fileService.getAssetsTranslationsSuffix();
    const addonStaticFolder = addonService.getAddonStaticFolder();

    return new MultiTranslateHttpLoader(http, [
        {
            prefix:
                addonStaticFolder.length > 0
                    ? addonStaticFolder + translationsPath
                    : translationsPath,
            suffix: translationsSuffix,
        },
        {
            prefix:
                addonStaticFolder.length > 0
                    ? addonStaticFolder + "assets/i18n/"
                    : "/assets/i18n/",
            suffix: ".json",
        },
    ]);
}

@NgModule({
    declarations: [
        AppComponent,
        CollectionsListComponent,
        GenericListComponent,
        CollectionForm,
        RelatedCollections,
        RelatedCollectionFormComponent,
        ItemSelectionComponent,
        MessageDialogComponent,
        ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        AppRoutingModule,
        PepSizeDetectorModule,
        MatIconModule,
        PepIconModule,
        PepTopBarModule,
        PepMenuModule,
        PepPageLayoutModule,
        PepButtonModule,
        PepDialogModule,
        PepListModule,
        PepSearchModule,
        PepTextboxModule,
        PepTextareaModule,
        MatDialogModule,
        PepDateModule,
        PepImageModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: createTranslateLoader,
                deps: [HttpClient, PepFileService, PepAddonService]
            }
        })

    ],
    exports:[CollectionsListComponent, GenericListComponent],

    providers: [],
    bootstrap: [AppComponent]                                             
})
export class AppModule {
    constructor(
        translate: TranslateService
    ) {

      let userLang = 'en';
      translate.setDefaultLang(userLang);
      userLang = translate.getBrowserLang().split('-')[0]; // use navigator lang if available

      if (location.href.indexOf('userLang=en') > -1) {
          userLang = 'en';
      }
      // the lang to use, if the lang isn't available, it will use the current loader to get them
      translate.use(userLang).subscribe((res: any) => {
          // In here you can put the code you want. At this point the lang will be loaded
      });
  }
}




