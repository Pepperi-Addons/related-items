import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PepListModule } from '@pepperi-addons/ngx-lib/list';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepSearchModule } from '@pepperi-addons/ngx-lib/search';
import { PepNgxCompositeLibModule } from '@pepperi-addons/ngx-composite-lib';
import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';

@NgModule({
    declarations: [

    ],
    imports: [ 
        CommonModule,
        PepPageLayoutModule,
        PepListModule,
        PepTopBarModule,
        PepNgxCompositeLibModule,
        PepGenericListModule,
        PepSearchModule],
    exports: [

    ],
    providers: [],
})
export class FeatureModule {}