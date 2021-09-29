import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { GenericListComponent, GenericListDataSource } from '../generic-list/generic-list.component';
import { RelatedItemsService } from '../../services/related-items.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CollectionForm } from '../collection-form/collection-form.component';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import { DialogService } from '../../services/dialog.service';
import { AddonService } from '../../services/addon.service';

@Component({
  selector: 'addon-collections',
  templateUrl: './collections-list.component.html',
  styleUrls: ['./collections-list.component.scss']
})
export class CollectionsListComponent implements OnInit {
  @ViewChild(GenericListComponent) genericList: GenericListComponent;

  constructor(
      public addonService: AddonService,
      public translate: TranslateService,
      public router: Router,
      public route: ActivatedRoute,
      public relatedItemsService: RelatedItemsService,
      private dialogService: DialogService
  ) {
    this.addonService.addonUUID = this.route.snapshot.params.addon_uuid;  
  }

  ngOnInit() { }

  listDataSource: GenericListDataSource = {
    getList: async (state) => {
      let res = await this.relatedItemsService.getCollections();
      if (state.searchString != "") {
        res = res.filter(collection => collection.Name.toLowerCase().includes(state.searchString.toLowerCase()))
      }
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
        Title: 'Related Items',
        Fields: [
          {
            FieldID: 'Name',
            Type: 'TextBox',
            Title: this.translate.instant('Name'),
            Mandatory: false,
            ReadOnly: true
          },
          {
            FieldID: 'Description',
            Type: 'TextBox',
            Title: this.translate.instant('Description'),
            Mandatory: false,
            ReadOnly: true
          },
          {
            FieldID: 'Count',
            Type: 'NumberInteger',
            Title: this.translate.instant('Count'),
            Mandatory: false,
            ReadOnly: true
          }
        ],
        Columns: [
          {
            Width: 40
          },
          {
            Width: 40
          }, {
            Width: 20
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
            this.goToRelatedCollection(objs[0].Name);
          }
        });
      }
      if (objs.length >= 1) {
        actions.push({
          title: this.translate.instant("Delete"),
          handler: async (objs) => {
            this.relatedItemsService.deleteCollections(objs).then(() => {
              this.genericList.reload();
            });
          }
        });
      }

      return actions;
    },

    getAddHandler: async () => {}
  }

  addCollecton() {
    let callback = async (data) => {
      if (data) {
        let collection = await this.relatedItemsService.getCollections(data.Name);
        if(collection.length === 0) { 
          await this.relatedItemsService.saveCollection({'Name':data.Name, 'Description':data.Description});
          this.goToRelatedCollection(data.Name)
        }
        else {
          let errorMessage = this.translate.instant('A collection with this name already exists, please choose a different name');
          return this.dialogService.openDialog("", MessageDialogComponent, [], { data: errorMessage });
        }
      }
    }
    return this.dialogService.openDialog(this.translate.instant("Add collection"), CollectionForm, [], { data: {shouldShowNameField: true} }, callback);
  }

  goToRelatedCollection(collectionName: string) {
    this.router.navigate([`${collectionName}`], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve'
    })
  }
}
