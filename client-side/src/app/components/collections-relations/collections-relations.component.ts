import { Component, OnInit, ViewChild } from '@angular/core';
import { GenericListComponent, GenericListDataSource} from '@pepperi-addons/ngx-composite-lib/generic-list';
import { RelatedItemsService } from '../../services/related-items.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ItemSelectionComponent } from '../item-selection/item-selection.component'
import { DialogService } from '../../services/dialog.service';
import { CollectionForm } from '../collection-form/collection-form.component';
import { Collection } from '../../../../../shared/entities';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import { AddonService } from 'src/app/services/addon.service';
import { PepDialogActionButton } from '@pepperi-addons/ngx-lib/dialog';

@Component({
  selector: 'addon-collections-relations',
  templateUrl: './collections-relations.component.html',
  styleUrls: ['./collections-relations.component.scss']
})
export class RelatedCollections implements OnInit {
  @ViewChild(GenericListComponent) genericList: GenericListComponent;

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

  noDataMessage:string;

  async initializeData() {
    this.collection = await this.relatedItemsService.getCollections(`?Name=${this.collectionName}`).then(objs => objs[0]);
  }

  listDataSource: GenericListDataSource = {
    getList: async (state) => {
      this.itemsInCollection = await this.relatedItemsService.getRelations(this.collectionName);
      this.noDataMessage = this.translate.instant("No_Related_Collection_Error");
      for (const item of this.itemsInCollection) {
        if (item.RelatedItems) {
          item.ItemsExternalIDList = item.RelatedItems.join(", ");
          this.noDataMessage = this.translate.instant("No_Results_Error");
        }
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
      }
    },

    getActions: async (objs) => {
      const actions = [];

      if (objs.length === 1) {
        actions.push({
          title: this.translate.instant("Edit"),
          handler: async (objs) => {
            this.router.navigate([objs[0].ItemExternalID], {
              relativeTo: this.route,
              queryParamsHandling: 'merge'
            });
          }
        });
      }
      if (objs.length >= 1) {
        actions.push({
          title: this.translate.instant("Delete"),
          handler: async (objs) => {
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
      new PepDialogActionButton(this.translate.instant('Delete'), 'main strong', () => this.relatedItemsService.deleteRelations(objs).then(() => {
        this.genericList.reload();
      })),
      new PepDialogActionButton(this.translate.instant('Cancel'), 'main weak')
    ];
    return this.dialogService.openDefaultDialog(this.translate.instant('Delete'), actionButtons,message);
  }

  addRelatedItems() {
    let callback = async (data) => {
      if (data) {
        //If the item is already in the collection, there is no need to do anything.
        if (this.itemsInCollection.indexOf(data.ItemExternalID) === -1) {
          let items = (await this.relatedItemsService.getItemsWithExternalId(data.ItemExternalID))
          if (items.length === 0) {
            let errorMessage = `Cannot find an item with external id '${data.ItemExternalID}'`;
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
    let data = { ItemsList: this.itemsInCollection, Title: `Add Item` }
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
