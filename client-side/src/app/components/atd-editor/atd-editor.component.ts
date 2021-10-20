import { Component, Input, Output, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { GenericListComponent, GenericListDataSource } from '../generic-list/generic-list.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PepDialogData } from '@pepperi-addons/ngx-lib/dialog';
import { FieldFormComponent } from '../field-form/field-form.component';
import { DialogService } from 'src/app/services/dialog.service';
import { AddonService } from 'src/app/services/addon.service';
import { RelatedItemsService } from 'src/app/services/related-items.service';
import {fieldFormMode} from 'src/app/components/field-form/field-form.component'

@Component({
  selector: 'addon-atd-editor',
  templateUrl: './atd-editor.component.html',
  styleUrls: ['./atd-editor.component.scss']
})
export class AtdEditorComponent implements OnInit {
   @ViewChild(GenericListComponent) genericList: GenericListComponent;

  @Input() hostObject: any;
  @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

  atdID: number;
  
  constructor(
    private relatedItemsService: RelatedItemsService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private addonService: AddonService) {
  }

  ngOnInit() {
    let configID = this.hostObject.objectList[0];
    this.relatedItemsService.getTypeInternalID(configID).then((atdId) => {
      this.atdID = atdId; 
    });
    this.addonService.addonUUID = "4f9f10f3-cd7d-43f8-b969-5029dad9d02b";
  }
  
  listDataSource: GenericListDataSource = {
    getList: async (state) => {
      let fieldsList = await this.relatedItemsService.getFieldsFromADAL();
      fieldsList.map(item => {
        if (item.ListSource.value) {
          item.ListName = item.ListSource.value;
        }
        else {
          item.ListName = item.ListSource
        }
      });
      return fieldsList;
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
            FieldID:'Name',
            Type: 'TextBox',
            Title: this.translate.instant('Name'),
            Mandatory: false,
            ReadOnly: true
          },
          {
            FieldID: 'APIName',
            Type: 'TextBox',
            Title: this.translate.instant('API Name'),
            Mandatory: false,
            ReadOnly: true
          },
          {
            FieldID: 'ListName',
            Type: 'TextBox',
            Title: this.translate.instant('List Source'),
            Mandatory: false,
            ReadOnly: true
          }
        ],
        Columns: [
          {
            Width: 33
          },
          {
            Width: 33
          }, {
            Width: 34
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
            this.openFieldForm(fieldFormMode.EditMode,objs[0]);
          }
        });
      }
      if (objs.length >= 1) {
        actions.push({
          title: this.translate.instant("Delete"),
          handler: async (objs) => {
            this.relatedItemsService.deleteFields(objs, this.atdID).then(() => {
              this.genericList.reload();
            });
          }
        });
      }

      return actions;
    }
  }

  async openFieldForm(fieldFormMode, fieldData?) {
    let callback = async (data) => {
      if (data) {
        if (await this.relatedItemsService.createTSAField({atdID: this.atdID, apiName: data.fieldData.APIName})) {
          this.relatedItemsService.updateFieldsTable({"Name": data.fieldData.Name, "APIName": data.fieldData.APIName, "ListSource": data.fieldData.ListSource, "ListType": data.fieldData.ListType, "Hidden": false}).then(() => {
            this.genericList.reload();
          });
        }
      }
    }
    // if the user arrives from the 'add button', the fieldData is undefined
    if (fieldData === undefined) {
      fieldData = {
        "Name": "",
        "APIName": "TSA"
      }
    }
    // Get list source's sources
    let collections = await this.relatedItemsService.getCollections();
    let collectionsName = collections.map(collection => {
      return {
        key: collection.Name,
        value: collection.Name
      }
   });
    let fields = await this.relatedItemsService.getFieldsOfItemsAndTransactionLine(this.atdID);

    const data = new PepDialogData({ title: this.translate.instant("Add Field"), content: { "fieldData": fieldData, "CollectionsList": collectionsName, "FieldsList": fields, "fieldFormMode": fieldFormMode}, actionsType: 'close' });
    this.dialogService.openDialog(this.translate.instant("Add Field"), FieldFormComponent, [], { data: data }, callback);
  }
}