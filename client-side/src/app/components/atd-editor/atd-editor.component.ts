import { Component, Input, Output, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PepDialogData } from '@pepperi-addons/ngx-lib/dialog';
import { FieldFormComponent } from '../field-form/field-form.component';
import { DialogService } from 'src/app/services/dialog.service';
import { AddonService } from 'src/app/services/addon.service';
import { RelatedItemsService } from 'src/app/services/related-items.service';
import { fieldFormMode } from 'src/app/components/field-form/field-form.component'
import { PepDialogActionButton } from '@pepperi-addons/ngx-lib/dialog';
import { GenericListComponent, IPepGenericListActions, IPepGenericListDataSource, IPepGenericListPager } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';

@Component({
  selector: 'addon-atd-editor',
  templateUrl: './atd-editor.component.html',
  styleUrls: ['./atd-editor.component.scss']
})
export class AtdEditorComponent implements OnInit {
  @ViewChild('glist1') glist1: GenericListComponent | undefined;

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
    this.addonService.addonUUID = "4f9f10f3-cd7d-43f8-b969-5029dad9d02b";
  }
  dataSource: IPepGenericListDataSource = this.getDataSource();

  pager: IPepGenericListPager = {
    type: 'scroll',
  };


  getDataSource() {
    return {
      init: async (params: any) => {
        let res = await this.relatedItemsService.getFieldsFromADAL(this.configID);
        res.map(item => {
          item.ListName = item.ListSource;
        });
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
                FieldID: 'FieldID',
                Type: 'TextBox',
                Title: this.translate.instant("API_Name"),
                Mandatory: false,
                ReadOnly: true
              },
              {
                FieldID: 'ListName',
                Type: 'TextBox',
                Title: this.translate.instant("List_Source_Title"),
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
          },
          totalCount: res.length,
          items: res
        });
      },
      inputs:
          {
            pager: {
              type: 'scroll'
            },
            selectionType: 'multi',
            noDataFoundMsg: this.translate.instant("No_Related_Items_Error")
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
            "Name": item.Fields[0]?.FormattedValue,
            "FieldID": item.Fields[1]?.FormattedValue,
            "ListName": item.Fields[2]?.FormattedValue
          }
          objs.push(object);
        }
      }
      const actions = [];
      if (data.rows.length === 1 && data?.selectionType !== 0) {
        actions.push({
          title: this.translate.instant("Edit"),
          handler: async (data) => {
            this.openFieldForm(fieldFormMode.EditMode, objs[0]);
          }
        });
      }
      if (data.rows.length >= 1 || data?.selectionType === 0) {
        actions.push({
          title: this.translate.instant("Delete"),
          handler: async (data) => {
            this.deleteFields(objs);
          }
        });
      }

      return actions;
    }
  }

  async deleteFields(objs) {
    const message = this.translate.instant("Delete_Field_Validate");
    const actionButtons = [
      new PepDialogActionButton(this.translate.instant("Delete"), 'main strong', () => this.relatedItemsService.deleteFields(objs, this.typeID).then(() => {
        this.dataSource = this.getDataSource();
      })),
      new PepDialogActionButton(this.translate.instant("Cancel"), 'main weak')
    ];
    return this.dialogService.openDefaultDialog(this.translate.instant("Delete"), actionButtons, message);
  }

  async openFieldForm(fieldFormMode, fieldData?) {
    let callback = async (data) => {
      if (data) {
        let field = { TypeID: this.typeID, Name: data.fieldData.Name, FieldID: data.fieldData.FieldID, ListSource: data.fieldData.ListSource, ListType: data.fieldData.ListType, Hidden: false };
        this.relatedItemsService.createTSAField(field).then(() =>
          this.dataSource = this.getDataSource()
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

    const data = new PepDialogData({ title: this.translate.instant("Add_Field_Button"), content: { "fieldData": fieldData, "fieldFormMode": fieldFormMode, "hostObject": this.hostObject }, actionsType: 'close' });
    this.dialogService.openDialog(this.translate.instant("Add_Field_Button"), FieldFormComponent, [], { data: data }, callback);
  }
}