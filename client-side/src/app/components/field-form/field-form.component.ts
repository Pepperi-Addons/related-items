import { Component, OnInit, Inject, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddonService } from 'src/app/services/addon.service';
import { DialogService } from 'src/app/services/dialog.service';
import { RelatedItemsService } from 'src/app/services/related-items.service';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import config from '../../../../../addon.config.json';

@Component({
  selector: 'addon-field-form',
  templateUrl: './field-form.component.html',
  styleUrls: ['./field-form.component.scss']
})

export class FieldFormComponent implements OnInit {

  @Input('ngModel')

  hostObject: any;
  dialogData: any;
  typeID: number;
  options: { key: string, value: string }[] = [];
  fieldsList: { key: string, value: string }[] = [];
  collectionsList: { key: string, value: string }[] = [];
  radioButtonsValue: string = "1";
  isFirstRadioButtonChecked: boolean = true;
  formMode: fieldFormMode = fieldFormMode.EditMode;
  title: string = "";


  constructor(
    private relatedItemsService: RelatedItemsService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<FieldFormComponent>,
    private addonService: AddonService,
    @Inject(MAT_DIALOG_DATA) public incoming: any,
  ) {
    this.dialogData = incoming.data.content;
    this.hostObject = this.dialogData.hostObject;
    this.formMode = this.dialogData.fieldFormMode;
    this.radioButtonsValue = this.dialogData.fieldData.ListType ? this.dialogData.fieldData.ListType : listSourceType.RelatedCollectionType;
    this.title = (this.formMode === fieldFormMode.EditMode) ? "Edit Field" : "Add Field";
  }

  ngOnInit() {
    let configID = this.hostObject.objectList[0];

    this.relatedItemsService.getTypeInternalID(configID).then((typeID) => {
      this.typeID = typeID;
    });
    //this.addonService.addonUUID = config.AddonUUID;
    this.addonService.addonUUID = "4f9f10f3-cd7d-43f8-b969-5029dad9d02b";

    this.initSourcesList();
  }

  async initSourcesList() {
    // Get list source's sources
    this.collectionsList = await this.relatedItemsService.getCollections().then((collections) =>
      this.options = collections.map(collection => {
        return { key: collection.Name, value: collection.Name };
      }));

    this.fieldsList = await this.relatedItemsService.getFieldsOfItemsAndTransactionLine(this.typeID).then((fields) =>
      this.options = fields.map(field => {
        return { key: field.value, value: field.value };
      }));

    this.options = this.collectionsList;
  }

  eventHandler(event) {
    if (event.target.value.length == 3 && (event.code == "Backspace" || event.code == "Delete")) {
      return false;
    }

    return true;
  }


  async onValueChanged(element, $event) {
    switch (element) {
      case 'Name': {
        if (this.formMode === fieldFormMode.AddMode) {
          this.dialogData.fieldData.FieldID = ('TSA' + $event).replace(/\s/g, "");
        }
        this.dialogData.fieldData.Name = $event;
        break;
      }
      case 'FieldID': {
        this.dialogData.fieldData.FieldID = 'TSA' + $event;
        break;
      }
      case 'ListSource': {
        this.dialogData.fieldData.ListSource = $event;
        break;
      }
    }
  }

  onRadioButtonSelect($event) {
    this.radioButtonsValue = $event.value

    if (this.radioButtonsValue === "2") {
      this.options = this.fieldsList;
      this.isFirstRadioButtonChecked = false;
    }
    else {
      this.options = this.collectionsList;
      this.isFirstRadioButtonChecked = true;
    }
  }

  async onSaveButtonClicked() {
    if (this.dialogData.fieldData.Name && this.dialogData.fieldData.FieldID && this.dialogData.fieldData.ListSource) {
      switch (this.formMode) {
        case fieldFormMode.EditMode:
          this.upsertField();
          break
        case fieldFormMode.AddMode:
          this.fieldValidation();
          break
      }
    }
    else {
      let errorMessage = `Please fill in all mandatory fields.`;
      this.dialogService.openDialog("", MessageDialogComponent, [], { data: errorMessage });
    }
  }

  async fieldValidation() {
    let field = await this.relatedItemsService.getTSASpecificField(this.dialogData.fieldData.FieldID)
    if (field === undefined) {
      this.upsertField();
    }
    else {
      let errorMessage = `Custom field with the name ${this.dialogData.fieldData.FieldID} already exists.`;
      this.dialogService.openDialog("", MessageDialogComponent, [], { data: errorMessage });
    }
  }

  async upsertField() {
    this.dialogData.fieldData.ListType = this.radioButtonsValue;
    this.dialogRef.close(this.dialogData);
  }
}

export enum fieldFormMode {
  EditMode = 0,
  AddMode = 1
}

export enum listSourceType {
  RelatedCollectionType = 1,
  FieldType = 2
}