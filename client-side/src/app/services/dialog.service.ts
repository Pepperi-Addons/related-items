import { Injectable } from '@angular/core';
import { PepDialogData, PepDialogService, PepDialogActionButton } from '@pepperi-addons/ngx-lib/dialog';
import { ComponentType } from '@angular/cdk/overlay';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  dialogRef;

  constructor(
    private dialogService: PepDialogService
  ) { }


  openDialog(title: string, content: ComponentType<any>, buttons: Array<PepDialogActionButton>, input: any, callbackFunc?: (any) => void): void {
    const dialogConfig = this.dialogService.getDialogConfig({ disableClose: true, panelClass: 'pepperi-standalone' }, 'inline')
    const data = new PepDialogData({ title: title, actionsType: 'custom', content: content, actionButtons: buttons })
    dialogConfig.data = data;

    this.dialogRef = this.dialogService.openDialog(content, input, dialogConfig);
    if (callbackFunc) {
      this.dialogRef.afterClosed().subscribe(res => {
        callbackFunc(res);
      });
    }
  }

  openDefaultDialog(title: string, actionButtons: Array<PepDialogActionButton>, input: any, callbackFunc?: (any) => void): void {
    const dialogData = new PepDialogData({ title, content: input, actionsType: 'custom', actionButtons });
    this.dialogService.openDefaultDialog(dialogData)
      .afterClosed().subscribe(res => {
        if (typeof res === 'function') {
          res();
        }
      });
  }
}
