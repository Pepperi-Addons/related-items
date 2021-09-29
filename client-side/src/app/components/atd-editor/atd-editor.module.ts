import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtdEditorComponent } from './index';
import { PepUIModule } from 'src/app/modules/pepperi.module';
import { AppModule } from 'src/app/app.module';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { PepFileService, PepAddonService } from '@pepperi-addons/ngx-lib';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';
import { FieldFormComponent } from '../field-form/field-form.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/modules/material.module';



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
  imports: [
    CommonModule,
    PepUIModule,
    MatDialogModule,
    MaterialModule,
    AppModule
  ],

  exports:[AtdEditorComponent],
  declarations: [
    AtdEditorComponent,
    FieldFormComponent
  ]
})
export class AtdEditorModule { 
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
