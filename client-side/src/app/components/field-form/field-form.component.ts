import { Component, OnInit, Inject, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog.service';
import { RelatedItemsService } from 'src/app/services/related-items.service';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';

@Component({
  selector: 'addon-field-form',
  templateUrl: './field-form.component.html',
  styleUrls: ['./field-form.component.scss']
})

export class FieldFormComponent implements OnInit {

  @Input('ngModel')

  dialogData: any;
  options: { key: string, value: string }[] = [];
  radioButtonsValue: string = "1";
  isFirstRadioButtonChecked: boolean = true;
  formMode: fieldFormMode = fieldFormMode.EditMode;

  constructor(
    private relatedItemsService: RelatedItemsService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<FieldFormComponent>,
    @Inject(MAT_DIALOG_DATA) public incoming: any,
  ) {
    this.dialogData = incoming.data.content;
    this.formMode = this.dialogData.fieldFormMode;
    this.radioButtonsValue = this.dialogData.fieldData.ListType ? this.dialogData.fieldData.ListType : "1";
  }

  ngOnInit() {
    if (this.radioButtonsValue === "2") {
      this.options = this.dialogData.FieldsList;
      this.isFirstRadioButtonChecked = false;
    }
    else {
      this.options = this.dialogData.CollectionsList;
      this.isFirstRadioButtonChecked = true;
    }
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
          this.dialogData.fieldData.APIName = ('TSA' + $event).replace(/\s/g, "");
        }
        this.dialogData.fieldData.Name = $event;
        break;
      }
      case 'APIName': {
        this.dialogData.fieldData.APIName = 'TSA' + $event;
        break;
      }
      case 'ListSource': {
        if (this.radioButtonsValue === "2") {
          this.dialogData.fieldData.ListSource = $event;
        }
        else {
          this.dialogData.fieldData.ListSource = $event;
        }
        break;
      }
    }
  }

  onRadioButtonSelect($event) {
    if ($event.value === '1') {
      this.radioButtonsValue = "1";
      this.options = this.dialogData.CollectionsList;
    }
    else {
      this.radioButtonsValue = "2";
      this.options = this.dialogData.FieldsList;
    }
  }

  async onSaveButtonClicked() {
    if (this.dialogData.fieldData.Name && this.dialogData.fieldData.APIName && this.dialogData.fieldData.ListSource) {
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
    let field = await this.relatedItemsService.getTSASpecificField(this.dialogData.fieldData.APIName)
    if (field === undefined) {
      this.upsertField();
    }
    else {
      let errorMessage = `Custom field with the name ${this.dialogData.fieldData.APIName} already exists.`;
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