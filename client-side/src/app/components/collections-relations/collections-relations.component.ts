import { Component, OnInit, ViewChild } from '@angular/core';
import { RelatedItemsService } from '../../services/related-items.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DialogService } from '../../services/dialog.service';
import { Collection } from '../../../../../shared/entities';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import { AddonService } from 'src/app/services/addon.service';
import { PepDialogActionButton } from '@pepperi-addons/ngx-lib/dialog';
import { GenericListComponent, IPepGenericListActions, IPepGenericListDataSource, IPepGenericListPager } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { state } from '@angular/animations';
import { CollectionForm } from '../collection-form/collection-form.component';
import { ItemSelectionComponent } from '../item-selection/item-selection.component';

@Component({
  selector: 'addon-collections-relations',
  templateUrl: './collections-relations.component.html',
  styleUrls: ['./collections-relations.component.scss']
})
export class RelatedCollections implements OnInit {
  @ViewChild('glist1') glist1: GenericListComponent | undefined;
  itemsInCollection = [];

  constructor(
    public translate: TranslateService,
    public router: Router,
    public route: ActivatedRoute,
    public relatedItemsService: RelatedItemsService,
    public activatedRoute: ActivatedRoute,
    private dialogService: DialogService,
    private addonService: AddonService
  ) {
    this.addonService.addonUUID = this.route.snapshot.params.addon_uuid;

    this.collectionName = this.activatedRoute.snapshot.params["collection_name"];

    this.initializeData()
  }

  collectionName: string;
  collection: Collection = {
    'Name': "",
    'Description': ""
  };

  ngOnInit() {
  }

  noDataMessage: string;
  dataSource: IPepGenericListDataSource = this.getDataSource();

  pager: IPepGenericListPager = {
    type: 'scroll',
  };

  async initializeData() {
    this.collection = await this.relatedItemsService.getCollections(`?Name=${this.collectionName}`).then(objs => objs[0]);
  }

  getDataSource() {
    this.noDataMessage = this.translate.instant("No_Related_Collection_Error");
    return {
      init: async (params: any) => {
        this.itemsInCollection = await this.relatedItemsService.getRelations(this.collectionName);
        for (const item of this.itemsInCollection) {
          if (item.RelatedItems) {
            item.ItemsExternalIDList = item.RelatedItems.join(", ");
            this.noDataMessage = this.translate.instant("No_Results_Error");
          }
        }

        if (params.searchString != undefined && params.searchString != "") {
          this.itemsInCollection = this.itemsInCollection.filter(relatedItem => relatedItem.ItemExternalID.toLowerCase().includes(params.searchString.toLowerCase()))
        }
        return Promise.resolve({
          dataView: {
            Context: {
              Name: '',
              Profile: { InternalID: 0 },
              ScreenSize: 'Landscape'
            },
            Type: 'Grid',
            Title: 'Related Items',
            Fields: [
              {
                FieldID: 'ItemExternalID',
                Type: 'TextBox',
                Title: this.translate.instant('Item External Id'),
                Mandatory: false,
                ReadOnly: true
              },
              {
                FieldID: 'ItemsExternalIDList',
                Type: 'TextBox',
                Title: this.translate.instant('Recommendations'),
                Mandatory: false,
                ReadOnly: true
              }
            ],
            Columns: [
              {
                Width: 30
              },
              {
                Width: 70
              }
            ],

            FrozenColumnsCount: 0,
            MinimumColumnWidth: 0
          },
          totalCount: this.itemsInCollection.length,
          items: this.itemsInCollection
        });
      },
      inputs:
          {
            pager: {
              type: 'scroll'
            },
            selectionType: 'multi',
            noDataFoundMsg: this.noDataMessage
          }
     ,
    } as IPepGenericListDataSource
  }

  actions: IPepGenericListActions = {
    get: async (data) => {
      //Convert the data to the objects of the same type of the adal objects
      let objs = [];
      if (data && data.rows.length > 0) {
        for (let i = 0; i < data.rows.length; i++) {
          let item = this.glist1.getItemById(data.rows[i]);
          let object = {
            "CollectionName": this.collectionName,
            "ItemExternalID": item.Fields[0]?.FormattedValue,
            "RelatedItems": item.Fields[1]?.FormattedValue,
            "Key": `${this.collectionName}_${item.Fields[0]?.FormattedValue}`
          }
          objs.push(object);
        }
      }

      const actions = [];

      if (data.rows.length === 1 && data?.selectionType !== 0) {
        actions.push({
          title: this.translate.instant("Edit"),
          handler: async (data) => {
            this.router.navigate([objs[0].ItemExternalID], {
              relativeTo: this.route,
              queryParamsHandling: 'merge'
            });
          }
        });
      }
      if (data.rows.length >= 1 || data?.selectionType === 0) {
        actions.push({
          title: this.translate.instant("Delete"),
          handler: async (data) => {
            this.deleteRelation(objs);
          }
        });
      }
      return actions;
    }
  }

  async deleteRelation(objs) {
    const message = this.translate.instant("Delete_Relation_Validate");
    const actionButtons = [
      new PepDialogActionButton(this.translate.instant("Delete"), 'main strong', () => this.relatedItemsService.deleteRelations(objs).then(() => {
        this.dataSource = this.getDataSource();
      })),
      new PepDialogActionButton(this.translate.instant("Cancel"), 'main weak')
    ];
    return this.dialogService.openDefaultDialog(this.translate.instant("Delete"), actionButtons, message);
  }

  addRelatedItems() {
    let callback = async (data) => {
      if (data) {
        //If the item is already in the collection, there is no need to do anything.
        if (this.itemsInCollection.indexOf(data.ItemExternalID) === -1) {
          let items = (await this.relatedItemsService.getItemsWithExternalId(data.ItemExternalID))
          if (items.length === 0) {
            let errorMessage = this.translate.instant("Item_Not_Found_Error") + `'${data.ItemExternalID}'`;
            return this.dialogService.openDialog("", MessageDialogComponent, [], { data: errorMessage });
          }
          else {
            await this.relatedItemsService.addRelatedItems({ 'CollectionName': this.collectionName, 'ItemExternalID': data.ItemExternalID })
            this.router.navigate([`${data.ItemExternalID}`], {
              relativeTo: this.route,
              queryParamsHandling: 'merge'
            });
          }
        }
      }
    }
    let data = { ItemsList: this.itemsInCollection, Title: `Add Item`, Note:  `Item ID`}
    return this.dialogService.openDialog(this.translate.instant("Add Item"), ItemSelectionComponent, [], { data: data }, callback);
  }

  editClicked() {
    let callback = async (data) => {
      if (data) {
        this.collection.Description = data.Description;
        await this.relatedItemsService.saveCollection(this.collection);
      }
    }
    return this.dialogService.openDialog(this.translate.instant("Edit Collection"), CollectionForm, [], { data: { collectionObj: this.collection, shouldShowNameField: false } }, callback);
  }

  goBack() {
    this.router.navigate(['..'], {
      relativeTo: this.activatedRoute,
      queryParamsHandling: 'preserve'
    })
  }

  backClicked() {
    this.goBack();
  }
}
