import { Component, Input, Output, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { GenericListComponent, GenericListDataSource } from '../generic-list/generic-list.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PepDialogData } from '@pepperi-addons/ngx-lib/dialog';
import { FieldFormComponent } from '../field-form/field-form.component';
import { DialogService } from 'src/app/services/dialog.service';

@Component({
  selector: 'addon-atd-editor',
  templateUrl: './atd-editor.component.html',
  styleUrls: ['./atd-editor.component.scss']
})
export class AtdEditorComponent implements OnInit {
  @ViewChild(GenericListComponent) genericList: GenericListComponent;

  @Input() hostObject: any;
  @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

  title = "Related Items";

  constructor(public translate: TranslateService,
    private dialogService: DialogService) { }

  ngOnInit() {
  }

  listDataSource: GenericListDataSource = {
    getList: async (state) => {
      let res = [];

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
            FieldID: 'API Name',
            Type: 'TextBox',
            Title: this.translate.instant('Description'),
            Mandatory: false,
            ReadOnly: true
          },
          {
            FieldID: 'List Source',
            Type: 'NumberInteger',
            Title: this.translate.instant('Count'),
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
          }
        });
      }
      if (objs.length >= 1) {
        actions.push({
          title: this.translate.instant("Delete"),
          handler: async (objs) => {

          }
        });
      }

      return actions;
    },

    getAddHandler: async () => {}
  }

  addField() {
    let callback = async (data) => {
      if (data) {


      }
    } 
    const data = new PepDialogData({title: this.translate.instant("Add Field"), content: {"Name": " ", "API Name": " " }, actionsType: 'close'});
    return this.dialogService.openDialog(this.translate.instant("Add Field"), FieldFormComponent, [], { data: data }, callback);
  }

}
