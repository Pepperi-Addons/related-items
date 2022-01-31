import { Component, OnInit, ViewChild } from '@angular/core';
import { GenericListComponent, GenericListDataSource} from '@pepperi-addons/ngx-composite-lib/generic-list';
import { ItemSelectionComponent } from '../item-selection/item-selection.component'
import { RelatedItemsService } from '../../services/related-items.service';
import { ActivatedRoute, Router } from '@angular/router'
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DialogService } from '../../services/dialog.service';
import { ItemWithImageURL } from '../../../../../shared/entities';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import { AddonService } from 'src/app/services/addon.service';
import { PepDialogActionButton } from '@pepperi-addons/ngx-lib/dialog';

@Component({
  selector: 'addon-related-collection-form',
  templateUrl: './related-collection-form.component.html',
  styleUrls: ['./related-collection-form.component.scss']
})
export class RelatedCollectionFormComponent implements OnInit {
  @ViewChild(GenericListComponent) genericList: GenericListComponent;

  constructor(
    public translate: TranslateService,
    public router: Router,
    public route: ActivatedRoute,
    public relatedItemsService: RelatedItemsService,
    private dialogService: DialogService,
    private addonService: AddonService,
    public activatedRoute: ActivatedRoute
  ) {
    this.addonService.addonUUID = this.route.snapshot.params.addon_uuid;
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

  noDataMessage:string;

  async initializeData() {
    this.collectionName = this.activatedRoute.snapshot.params["collection_name"];
    this.externalID = this.activatedRoute.snapshot.params["external_id"];
    this.currentItem = await this.relatedItemsService.getItemsInCollection(this.collectionName, this.externalID);
    this.imageSource = this.currentItem.PresentedItem.ImageURL;
    this.itemTitle = this.currentItem.PresentedItem.ExternalID;
    this.itemDescription = this.currentItem.PresentedItem.LongDescription;
  }

  listDataSource: GenericListDataSource = {
    getList: async (state) => {
      this.currentItem = await this.relatedItemsService.getItemsInCollection(this.collectionName, this.externalID);
      this.noDataMessage = this.translate.instant("No_Related_Items_In_Item_Error")
      if (!this.currentItem.RelatedItems) {
        this.currentItem.RelatedItems = [];
      }
      if (state.searchString != "") {
        this.currentItem.RelatedItems = this.currentItem.RelatedItems.filter(item => item.ExternalID.toLowerCase().includes(state.searchString.toLowerCase()))
        this.noDataMessage = this.translate.instant("No_Results_Error")
      }

      return this.currentItem.RelatedItems;
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
      }
    },

    getActions: async (objs) => {
      const actions = [];

      if (objs.length >= 1) {
        actions.push({
          title: this.translate.instant("Delete"),
          handler: async (objs) => {
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
      new PepDialogActionButton(this.translate.instant('Delete'), 'main strong', () => {
        let itemsToRemove = objs.map(obj => { 
          return obj.ExternalID
        });
        let itemToUpdate = {'CollectionName': this.collectionName, 'ItemExternalID': this.externalID, 'itemsToRemove': itemsToRemove}
        this.relatedItemsService.deleteRelatedItems(itemToUpdate).then(() => {
          this.genericList.reload();
        });
      }),
      new PepDialogActionButton(this.translate.instant('Cancel'), 'main weak')
    ];
    return this.dialogService.openDefaultDialog(this.translate.instant('Delete'), actionButtons,message);
  }

addRelatedItem() {
  let callback = async (data) => {
    if (data) {
    let ans = await this.relatedItemsService.addRelatedItems({ 'CollectionName': this.collectionName, 'ItemExternalID': this.externalID, 'RelatedItems': data.ItemExternalID.split(";")})
      if (ans != "") {
        return this.dialogService.openDialog("", MessageDialogComponent, [], { data: ans }, async () => this.genericList.reload());
      }
    }
  };
      let data = { ItemsList: this.currentItem.RelatedItems, Title: `Add Items` }
    return this.dialogService.openDialog(this.translate.instant("Add Item"), ItemSelectionComponent, [], { data: data }, callback);
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
