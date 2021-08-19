import { Component, OnInit, ViewChild } from '@angular/core';
import { GenericListComponent, GenericListDataSource } from '../generic-list/generic-list.component';
import { RelatedItemsService } from '../../services/related-items.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'addon-related-collections',
  templateUrl: './related-collections.component.html',
  styleUrls: ['./related-collections.component.scss']
})
export class RelatedCollections implements OnInit {

  constructor(
    public translate: TranslateService,
    public router: Router,
    public route: ActivatedRoute,
    public relatedItemsService: RelatedItemsService,
    public activatedRoute: ActivatedRoute,
  ) { 
    this.collectionName = this.activatedRoute.snapshot.params["collection_name"];
  }

  collectionName: string;

  ngOnInit() {
  }

  listDataSource: GenericListDataSource = {
    getList: async (state) => {
      let res = this.relatedItemsService.getRelations(this.collectionName);
      return res;
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
            FieldID: 'ItemUUID',
            Type: 'TextBox',
            Title: this.translate.instant('Item'),
            Mandatory: false,
            ReadOnly: true
          },
          {
            FieldID: 'CollectionName',
            Type: 'TextBox',
            Title: this.translate.instant('Collection Name'),
            Mandatory: false,
            ReadOnly: true
          },
          {
            FieldID: 'Relateditems',
            Type: 'ListOfObjects',
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

      return actions;
    },

    getAddHandler: async () => {
      return this.router.navigate(["./addItem"], {
        relativeTo: this.route,
        queryParamsHandling: 'merge'
      });
    }
  }

}
