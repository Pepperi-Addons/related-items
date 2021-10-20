import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GenericListComponent } from '../components/generic-list/generic-list.component';
import { PepListModule } from '@pepperi-addons/ngx-lib/list';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepSearchModule } from '@pepperi-addons/ngx-lib/search';

@NgModule({
    declarations: [
        GenericListComponent
    ],
    imports: [ 
        CommonModule,
        PepPageLayoutModule,
        PepListModule,
        PepTopBarModule,
        PepSearchModule],
    exports: [
        GenericListComponent
    ],
    providers: [],
})
export class FeatureModule {}