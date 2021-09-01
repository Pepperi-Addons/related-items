import { Component, OnInit, ViewChild } from '@angular/core';
import { GenericListComponent, GenericListDataSource } from '../generic-list/generic-list.component';
import { RelatedItemsService } from '../../services/related-items.service';
import { ActivatedRoute, Router } from '@angular/router'
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PepCustomizationService, PepLoaderService, PepStyleType } from '@pepperi-addons/ngx-lib';
import { PepDialogActionsType, PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';

@Component({
  selector: 'addon-related-collection-form',
  templateUrl: './related-collection-form.component.html',
  styleUrls: ['./related-collection-form.component.scss']
})
export class RelatedCollectionFormComponent implements OnInit {
  @ViewChild(GenericListComponent) genericList: GenericListComponent;

  constructor(public translate: TranslateService,
              public router: Router,
              public route: ActivatedRoute,
              public relatedItemsService: RelatedItemsService,
              public loaderService: PepLoaderService,
              public activatedRoute: ActivatedRoute,
              private dialogService: PepDialogService) { 
                this.collectionName = this.activatedRoute.snapshot.params["collection_name"];
              }

  collectionName: string;

  ngOnInit() {
  }

  listDataSource: GenericListDataSource = {
    getList: async (state) => {

      return [];
    },

    getDataView: async () => {
      return {
        Context: {
          Name: '',
          Profile: { InternalID: 0 },
          ScreenSize: 'Landscape'
        },
        Type: 'Grid',
        Title: 'Related Collections',
        Fields: [
          {
            FieldID: 'ItemExternalID',
            Type: 'TextBox',
            Title: this.translate.instant('Item'),
            Mandatory: false,
            ReadOnly: true
          },
          {
            FieldID: 'ItemsExternalIDList',
            Type: 'TextBox',
            Title: this.translate.instant('Related Items'),
            Mandatory: false,
            ReadOnly: true
          }
        ],
        Columns: [
          {
            Width: 25
          },
          {
            Width: 25
          }, {
            Width: 25
          }
        ],

        FrozenColumnsCount: 0,
        MinimumColumnWidth: 0
      }
    },

    getActions: async (objs) => {
      const actions = [];

      if (objs.length >= 1) {
        actions.push({
          title: this.translate.instant("Delete"),
          handler: async (objs) => {
            this.relatedItemsService.deleteRelations(objs).then(() => {
                this.genericList.reload();
            });
          }
        });
      }

      return actions;
    },

    getAddHandler: async () => {
      return this.router.navigate(["./addRelation"], {
        relativeTo: this.route,
        queryParamsHandling: 'merge'
      });
    }
  }

  fileChange() {}

  goBack() {
    this.loaderService.show;
    this.router.navigate(['..'], {
      relativeTo: this.activatedRoute,
      queryParamsHandling: 'preserve'
    })
  }

  backClicked() {
    this.goBack();
  }

}
