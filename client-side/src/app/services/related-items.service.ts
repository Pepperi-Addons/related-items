import { AddonService } from "../components/addon";
import { Injectable } from '@angular/core';
import { Collection } from '../../../../shared/entities';
import { RelationItem } from '../../../../shared/entities';
import { PepHttpService } from "@pepperi-addons/ngx-lib";
import { PepDialogActionsType, PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';

@Injectable({
    providedIn: 'root'
})

export class RelatedItemsService {

    dialogRef;

    constructor(private addonService: AddonService,
        private pepHttp: PepHttpService,
        private dialogService: PepDialogService) {

    }

    getCollections(option) {
        return this.addonService.pepGet(`/addons/api/${this.addonService.addonUUID}/api/collections?${option}`).toPromise();
    }

    saveCollection(collection) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/collections`, collection).toPromise();
    }

    deleteCollections(collections: Collection[]) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/delete_collections`, collections).toPromise();
    }

    getRelations(collectionName: String) {
        return this.addonService.papiClient.addons.api.uuid(this.addonService.addonUUID).file('api').func('relation').get({ CollectionName: collectionName });
    }

    deleteRelations(relation: RelationItem[]) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/delete_relations`, relation).toPromise();
    }

    addRelatedItems(relatedItems) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/add_items_to_relation_with_externalid`, relatedItems).toPromise();
    }

    deleteRelatedItems(relatedItems: RelationItem[]) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/remove_items_from_relation_with_externalid`, relatedItems).toPromise();
    }

    openDialog(title = 'Modal Test', content, buttons, input, callbackFunc = null): void {
        const dialogConfig = this.dialogService.getDialogConfig({ disableClose: true, panelClass: 'pepperi-standalone' }, 'inline')
        const data = new PepDialogData({ title: title, actionsType: 'custom', content: content, actionButtons: buttons })
        dialogConfig.data = data;

        this.dialogRef = this.dialogService.openDialog(content, input, dialogConfig);
        this.dialogRef.afterClosed().subscribe(res => {
            callbackFunc(res);
        });
    }
}