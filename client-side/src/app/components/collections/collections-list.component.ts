import { Component, OnInit, ViewChild } from '@angular/core';
import { GenericListComponent, IPepGenericListActions, IPepGenericListDataSource, IPepGenericListPager } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { RelatedItemsService } from '../../services/related-items.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CollectionForm } from '../collection-form/collection-form.component';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import { DialogService } from '../../services/dialog.service';
import { AddonService } from '../../services/addon.service';
import { PepDialogActionButton } from '@pepperi-addons/ngx-lib/dialog';
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';
import { ViewContainerRef } from "@angular/core";
import { DIMXHostObject, PepDIMXHelperService } from '@pepperi-addons/ngx-composite-lib';
import { config } from '../../addon.config';
import { Collection } from 'shared';


@Component({
  selector: 'addon-collections',
  templateUrl: './collections-list.component.html',
  styleUrls: ['./collections-list.component.scss']
})
export class CollectionsListComponent implements OnInit {
  @ViewChild('glist1') glist1: GenericListComponent | undefined;

  noDataMessage: string;
  menuItems = [
    {
      key: 'import',
      text: this.translate.instant("Import")
    },
    {
      key: 'export',
      text: this.translate.instant("Export")
    }
  ];
  dataSource: IPepGenericListDataSource;

  pager: IPepGenericListPager = {
    type: 'scroll',
  };

  collectionsList: Collection[] = [];

  constructor(
    public addonService: AddonService,
    public translate: TranslateService,
    public router: Router,
    public route: ActivatedRoute,
    public relatedItemsService: RelatedItemsService,
    private dialogService: DialogService,
    private viewContainerRef: ViewContainerRef,
    private dimxService: PepDIMXHelperService
  ) {
    this.addonService.addonUUID = config.AddonUUID;
  }

  async ngOnInit() {
    // waiting for translate to load
    await this.translate.get('No_Related_Collection_Error').toPromise();

    this.dataSource = this.getDataSource();
    const dimxHostObject: DIMXHostObject = {
      DIMXAddonUUID: this.addonService.addonUUID,
      DIMXResource: "related_items",
    }
    this.dimxService.register(this.viewContainerRef, dimxHostObject, (onDIMXProcessDoneEvent: any) => {
      this.onDIMXProcessDone(onDIMXProcessDoneEvent);
    })
  }

    getDataSource() {
      this.noDataMessage = this.translate.instant("No_Related_Collection_Error");
      return {
        init: async (params: any) => {
          this.collectionsList = await this.relatedItemsService.getCollections();
          console.log("Collection after refresh:", this.collectionsList);
           this.noDataMessage = this.translate.instant("No_Related_Collection_Error")
          if (params.searchString != undefined && params.searchString != "") {
            this.collectionsList = this.collectionsList.filter(collection => collection.Name.toLowerCase().includes(params.searchString.toLowerCase()))
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
              Title: 'Related Items',
              Fields: [
                {
                  FieldID: 'Name',
                  Type: 'TextBox',
                  Title: this.translate.instant("Name"),
                  Mandatory: false,
                  ReadOnly: true
                },
                {
                  FieldID: 'Description',
                  Type: 'TextBox',
                  Title: this.translate.instant("Description"),
                  Mandatory: false,
                  ReadOnly: true
                },
                {
                  FieldID: 'Count',
                  Type: 'NumberInteger',
                  Title: this.translate.instant("Count"),
                  Mandatory: false,
                  ReadOnly: true
                }
              ],
              Columns: [
                {
                  Width: 35
                },
                {
                  Width: 35
                }, {
                  Width: 30
                }
              ],

              FrozenColumnsCount: 0,
              MinimumColumnWidth: 0
            },
            totalCount: this.collectionsList.length,
            items: this.collectionsList
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
      get: async (data: PepSelectionData) => {
        //Convert data to the objects of the same type of the adal objects
        let objs = [];
        if (data && data.rows.length > 0) {
          for (let i = 0; i < data.rows.length; i++) {
            let item = this.glist1.getItemById(data.rows[i]);
            let object = {
              "Name": item.Fields[0]?.FormattedValue,
              "Description": item.Fields[1]?.FormattedValue,
            }
            objs.push(object);
          }
        }

        const actions = [];
        if (data.rows.length === 1 && data?.selectionType !== 0) {
          actions.push({
            title: this.translate.instant("Edit"),
            handler: async (data) => {
              this.goToRelatedCollection(objs[0].Name);
            }
          });
        }
        if (data.rows.length >= 1 || data?.selectionType === 0) {
          // if selectAll button was clicked configure the collection to delete
          let collectionsToDelete = this.getCollectionsToDelete(data);
          //  if selectAll button wasn'r clicked the 'collectionsToDelete' will be undefined and we need to delete the selected collections(objs)
          collectionsToDelete = collectionsToDelete ? collectionsToDelete : objs;
          actions.push({
            title: this.translate.instant("Delete"),
            handler: async (data) => {
              this.deleteCollections(collectionsToDelete);
            }
          });
        }
        return actions;
      }
    }

  getCollectionsToDelete(data: PepSelectionData, objs?: any[]) {
    // selectAll button was clicked
    if (data.selectionType === 0) {
      // when selectAll button is clicked the getSelectedItems return the unselected items
      const items = this.glist1.getSelectedItems();
      let collectionsToDelete = this.collectionsList;
      items.rows.forEach(row => {
        let item = this.glist1.getItemById(row);
        collectionsToDelete = collectionsToDelete.filter(collection => collection.Name !== item.Fields[0]?.FormattedValue);
        
      });
        return collectionsToDelete
    }
    return undefined;
  }

  async deleteCollections(objs) {
      const message = this.translate.instant("Delete_Collection_Validate");
      const actionButtons = [
        new PepDialogActionButton(this.translate.instant("Delete"), 'main strong', () => this.relatedItemsService.deleteCollections(objs).then(() => {
          this.dataSource = this.getDataSource();
        })),
        new PepDialogActionButton(this.translate.instant("Cancel"), 'main weak')
      ];
      return this.dialogService.openDefaultDialog(this.translate.instant("Delete"), actionButtons, message);
    }

    addCollecton() {
      let callback = async (data) => {
        if (data) {
          let collection = await this.relatedItemsService.getCollections(`?Name=${data.Name}`);
          if (collection.length === 0 || collection[0].Hidden == true) {
            await this.relatedItemsService.saveCollection({ 'Name': data.Name, 'Description': data.Description });
            this.goToRelatedCollection(data.Name)
          }
          else {
            let errorMessage = this.translate.instant("Existing_Name_Error_1") + '\n' + this.translate.instant("Existing_Name_Error_2");
            return this.dialogService.openDialog("", MessageDialogComponent, [], { data: errorMessage }, () => { });
          }
        }
      }
      return this.dialogService.openDialog(this.translate.instant("Add_Collection_Button"), CollectionForm, [], { data: { shouldShowNameField: true } }, callback);
    }

    goToRelatedCollection(collectionName: string) {
      this.router.navigate([encodeURIComponent(`${collectionName}`)], {
        relativeTo: this.route,
        queryParamsHandling: 'preserve'
      })
    }

    //DIMX
    menuItemClick($event) {
      switch ($event.source.key) {
        case 'import': {
          this.dimxService?.import({
            OverwriteObject: true,
            Delimiter: ",",
            OwnerID: this.addonService.addonUUID
          });
          break
        }
        case 'export': {
          this.dimxService?.export({
            DIMXExportFormat: "csv",
            DIMXExportIncludeDeleted: false,
            DIMXExportFileName: "items_collections_export",
            DIMXExportFields: "CollectionName,ItemExternalID,RelatedItems",
            DIMXExportDelimiter: ","
          });
          break
        }
      }
    }

    onDIMXProcessDone(event) {
      console.log("Refreshing now");
      console.log("process done event", JSON.stringify(event));
      this.dataSource = this.getDataSource();
    }
  }
