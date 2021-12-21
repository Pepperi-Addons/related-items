import { Component, Input, Output, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PepDialogData } from '@pepperi-addons/ngx-lib/dialog';
import { FieldFormComponent } from '../field-form/field-form.component';
import { DialogService } from 'src/app/services/dialog.service';
import { AddonService } from 'src/app/services/addon.service';
import { RelatedItemsService } from 'src/app/services/related-items.service';
import {fieldFormMode} from 'src/app/components/field-form/field-form.component'
import config from '../../../../../addon.config.json';
import { GenericListComponent, GenericListDataSource} from '@pepperi-addons/ngx-composite-lib/generic-list';

@Component({
  selector: 'addon-atd-editor',
  templateUrl: './atd-editor.component.html',
  styleUrls: ['./atd-editor.component.scss']
})
export class AtdEditorComponent implements OnInit {
   @ViewChild(GenericListComponent) genericList: GenericListComponent;

  @Input() hostObject: any;
  @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

  typeID: number;
  configID: string;
  
  constructor(
    private relatedItemsService: RelatedItemsService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private addonService: AddonService) {
  }

   ngOnInit() {
    this.configID = this.hostObject.objectList[0];
    this.relatedItemsService.getTypeInternalID(this.configID).then(typeID => {
      this.typeID = typeID;
    });
    //this.addonService.addonUUID = config.AddonUUID;
    this.addonService.addonUUID = "4f9f10f3-cd7d-43f8-b969-5029dad9d02b";
  }

  listDataSource: GenericListDataSource = {
    getList: async (state) => {
      let fieldsList = await this.relatedItemsService.getFieldsFromADAL(this.configID);
      fieldsList.map(item => {
        item.ListName = item.ListSource;
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
            FieldID: 'FieldID',
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
            this.relatedItemsService.deleteFields(objs, this.typeID).then(() => {
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
        let field = { TypeID: this.typeID, Name: data.fieldData.Name, FieldID: data.fieldData.FieldID, ListSource: data.fieldData.ListSource, ListType: data.fieldData.ListType, Hidden: false};
        this.relatedItemsService.createTSAField(field).then(() =>
        this.genericList.reload()
        );
      }
    }
    // if the user arrives from the 'add button', the fieldData is undefined
    if (fieldData === undefined) {
      fieldData = {
        "Name": "",
        "FieldID": "TSA"
      }
    }

    const data = new PepDialogData({ title: this.translate.instant("Add Field"), content: { "fieldData": fieldData, "fieldFormMode": fieldFormMode, "hostObject": this.hostObject}, actionsType: 'close' });
    this.dialogService.openDialog(this.translate.instant("Add Field"), FieldFormComponent, [], { data: data }, callback);
  }
}