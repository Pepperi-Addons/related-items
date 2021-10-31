import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import {  map } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { Observable } from 'rxjs';
import { InstalledAddon } from '@pepperi-addons/papi-sdk';
import { ActivatedRoute } from '@angular/router';
import { AddonService } from 'src/app/services/addon.service';
import { PepperiTableComponent } from '.';


@Component({
  selector: 'addon-module',
  templateUrl: './addon.component.html',
  styleUrls: ['./addon.component.scss'],
  providers: [TranslatePipe]
})
export class AddonComponent implements OnInit {

    screenSize: PepScreenSizeType;
    options: {key:string, value:string}[] = [];
    dataSource$: Observable<any[]>
    displayedColumns = ['Name', 'Description'];
    @Input() hostObject: any;
    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();
    @ViewChild(PepperiTableComponent) table: PepperiTableComponent;


    constructor(
        public addonService: AddonService,
        public layoutService: PepLayoutService,
        public dialog: PepDialogService,
        public translate: TranslateService,
        public route: ActivatedRoute
    ) {
        this.addonService.addonUUID = this.route.snapshot.params.addon_uuid; 
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });

    }

    ngOnInit(){
       this.dataSource$ = this.addonService.pepGet(`/addons/installed_addons`)
       .pipe(
           map((addons: InstalledAddon[]) =>
             addons.filter(addon => addon?.Addon).map(addon => addon?.Addon))
        );
    }

    openDialog(){
        const content = this.translate.instant('Dialog_Body');
        const title = this.translate.instant('Dialog_Title');
        const dataMsg = new PepDialogData({title, actionsType: "close", content});
        this.dialog.openDefaultDialog(dataMsg);
    }





}
