import { Component, OnInit, ViewChild } from '@angular/core';
import { GenericListComponent, PepGenericListService } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { ItemSelectionComponent } from '../item-selection/item-selection.component'
import { RelatedItemsService } from '../../services/related-items.service';
import { ActivatedRoute, Router } from '@angular/router'
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DialogService } from '../../services/dialog.service';
import { ItemWithImageURL } from 'shared';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import { AddonService } from 'src/app/services/addon.service';
import { PepDialogActionButton } from '@pepperi-addons/ngx-lib/dialog';
import { IPepGenericListActions, IPepGenericListDataSource, IPepGenericListPager } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';
import { config } from '../../addon.config';

@Component({
  selector: 'addon-related-collection-form',
  templateUrl: './related-collection-form.component.html',
  styleUrls: ['./related-collection-form.component.scss']
})
export class RelatedCollectionFormComponent implements OnInit {
  @ViewChild('glist1') glist1: GenericListComponent | undefined;

  constructor(
    public translate: TranslateService,
    public router: Router,
    public route: ActivatedRoute,
    public relatedItemsService: RelatedItemsService,
    private dialogService: DialogService,
    private addonService: AddonService,
    public activatedRoute: ActivatedRoute
  ) {
    this.addonService.addonUUID = config.AddonUUID;
    this.initializeData();
  }

  collectionName: string;
  externalID: string;
  currentItem: { 'PresentedItem': ItemWithImageURL, 'RelatedItems': ItemWithImageURL[] };
  imageSource: string;
  itemTitle: string;
  itemDescription: string;

  ngOnInit() {
  }

  noDataMessage: string;
  dataSource: IPepGenericListDataSource = this.getDataSource();

  pager: IPepGenericListPager = {
    type: 'scroll',
  };

  async initializeData() {
    this.collectionName = this.activatedRoute.snapshot.params["collection_name"];
    this.externalID = this.activatedRoute.snapshot.params["external_id"];
    this.currentItem = await this.relatedItemsService.getItemsInCollection(this.collectionName, this.externalID);
    this.imageSource = this.currentItem.PresentedItem.ImageURL;
    this.itemTitle = this.currentItem.PresentedItem.ExternalID;
    this.itemDescription = this.currentItem.PresentedItem.LongDescription;
  }

  getDataSource() {
    this.noDataMessage = this.translate.instant("No_Related_Items_In_Item_Error")
    return {
      init: async (params: any) => {
        this.currentItem = await this.relatedItemsService.getItemsInCollection(this.collectionName, this.externalID);
        if (!this.currentItem.RelatedItems) {
          this.currentItem.RelatedItems = [];
        }
        if (params.searchString != undefined && params.searchString != "") {
          this.currentItem.RelatedItems = this.currentItem.RelatedItems.filter(item => item.ExternalID.toLowerCase().includes(params.searchString.toLowerCase()))
          this.noDataMessage = this.translate.instant("No_Results_Error")
        }
        return Promise.resolve({
          dataView: {
            Context: {
              Name: '',
              Profile: { InternalID: 0 },
              ScreenSize: 'Landscape'
            },
            Type: 'Grid',
            Title: 'Related Collections',
            Fields: [
              {
                FieldID: 'ImageURL',
                Type: 'ImageURL',
                Title: this.translate.instant('Image'),
                Mandatory: false,
                ReadOnly: true
              },
              {
                FieldID: 'ExternalID',
                Type: 'TextBox',
                Title: this.translate.instant('External Id'),
                Mandatory: false,
                ReadOnly: true
              },
              {
                FieldID: 'LongDescription',
                Type: 'TextBox',
                Title: this.translate.instant('Description'),
                Mandatory: false,
                ReadOnly: true
              }
            ],
            Columns: [
              {
                Width: 15
              },
              {
                Width: 15
              },
              {
                Width: 70
              }
            ],

            FrozenColumnsCount: 0,
            MinimumColumnWidth: 0
          },
          totalCount: this.currentItem.RelatedItems.length,
          items: this.currentItem.RelatedItems
        });
      },
      inputs:
          {
            pager: {
              type: 'scroll'
            },
            selectionType: 'multi',
            noDataFoundMsg: this.noDataMessage
          },
    } as IPepGenericListDataSource
  }
  actions: IPepGenericListActions = {
    get: async (data: PepSelectionData) => {
      //Convert the data to the objects of the same type of the adal objects
      let objs = [];
      if (data && data.rows.length > 0) {
        for (let i = 0; i < data.rows.length; i++) {
          let item = this.glist1.getItemById(data.rows[i]);
          let object = {
            "ImageURL": item.Fields[0]?.FormattedValue,
            "ExternalID": item.Fields[1]?.FormattedValue,
            "LongDescription": item.Fields[2]?.FormattedValue
          }
          objs.push(object);
        }
      }

      const actions = [];

      if (data.rows.length >= 1 || data?.selectionType === 0) {
        actions.push({
          title: this.translate.instant("Delete"),
          handler: async (data) => {
            this.deleteItem(objs);
          }
        });
      }
      return actions;
    }
  }

  async deleteItem(objs) {
    const message = this.translate.instant("Delete_Item_Validate");
    const actionButtons = [
      new PepDialogActionButton(this.translate.instant("Delete"), 'main strong', () => {
        let itemsToRemove = objs.map(obj => {
          return obj.ExternalID
        });
        let itemToUpdate = { 'CollectionName': this.collectionName, 'ItemExternalID': this.externalID, 'itemsToRemove': itemsToRemove }
        this.relatedItemsService.deleteRelatedItems(itemToUpdate).then(() => {
          this.dataSource = this.getDataSource();
        });
      }),
      new PepDialogActionButton(this.translate.instant("Cancel"), 'main weak')
    ];
    return this.dialogService.openDefaultDialog(this.translate.instant("Delete"), actionButtons, message);
  }

  addRelatedItem() {
    let callback = async (data) => {
      if (data) {
        let ans = await this.relatedItemsService.addRelatedItems({ 'CollectionName': this.collectionName, 'ItemExternalID': this.externalID, 'RelatedItems': data.ItemExternalID.split(";") })
        if (ans != "") {
          return this.dialogService.openDialog("", MessageDialogComponent, [], { data: ans }, async () => {
            this.dataSource = this.getDataSource();
          });
        }
      }
    };
    let data = { ItemsList: this.currentItem.RelatedItems, Title: this.translate.instant("Add_Items_Title"), Note:  this.translate.instant('Add_Related_Items_Note') }
    return this.dialogService.openDialog(this.translate.instant("Add_Item_Title"), ItemSelectionComponent, [], { data: data }, callback);
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
