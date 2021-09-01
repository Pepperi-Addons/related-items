import { Component, OnInit, ViewChild } from '@angular/core';
import { GenericListComponent, GenericListDataSource } from '../generic-list/generic-list.component';
import { RelatedItemsService } from '../../services/related-items.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PepCustomizationService, PepLoaderService, PepStyleType } from '@pepperi-addons/ngx-lib';
import { ItemSelectionComponent } from '../item-selection/item-selection.component'

@Component({
  selector: 'addon-related-collections',
  templateUrl: './related-collections.component.html',
  styleUrls: ['./related-collections.component.scss']
})
export class RelatedCollections implements OnInit {
  @ViewChild(GenericListComponent) genericList: GenericListComponent;

  showLoading = true;
  itemsInCollection = [];

  constructor(
    public translate: TranslateService,
    public router: Router,
    public route: ActivatedRoute,
    public relatedItemsService: RelatedItemsService,
    public loaderService: PepLoaderService,
    public activatedRoute: ActivatedRoute
  ) {
    this.collectionName = this.activatedRoute.snapshot.params["collection_name"];

    this.loaderService.onChanged$
    .subscribe((show) => {
        this.showLoading = show;
    });
  }

  collectionName: string;

  ngOnInit() {
  }

  listDataSource: GenericListDataSource = {
    getList: async (state) => {

      this.itemsInCollection = await this.relatedItemsService.getRelations(this.collectionName);
      for (const item of this.itemsInCollection) {
        item.ItemsExternalIDList = item.RelatedItems.join(", ");
      }

      if (state.searchString != "") {
        this.itemsInCollection = this.itemsInCollection.filter(relatedItem => relatedItem.ItemExternalID.toLowerCase().includes(state.searchString.toLowerCase()))
    }

      return this.itemsInCollection;
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
      let callback = async(data) => {
        if (data) {
         this.router.navigate(["./addRelation"], {
            relativeTo: this.route,
            queryParamsHandling: 'merge'
          });
        }
      }
      let data = {itemsList: this.itemsInCollection}
      return this.relatedItemsService.openDialog("Add Relation", ItemSelectionComponent, [], {data: data}, callback);
    }
  }

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
