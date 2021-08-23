import { AddonService } from "../components/addon";
import { Injectable } from '@angular/core';
import {Collection} from '../../../../shared/entities';
import {RelationItem} from '../../../../shared/entities';
import { PepHttpService } from "@pepperi-addons/ngx-lib";

@Injectable({
    providedIn: 'root'
  })

export class RelatedItemsService {
    
    constructor(private addonService: AddonService,
                private pepHttp: PepHttpService) {

    }

    getCollections(option) {
        return this.addonService.papiClient.addons.api.uuid(this.addonService.addonUUID).file('api').func('collections').get(option);
    }

    saveCollection(collection) {
        return this.addonService.papiClient.addons.api.uuid(this.addonService.addonUUID).file('api').func('collections').post(undefined, collection);
    }

    deleteCollections(collections: Collection[]) {
        return this.addonService.papiClient.addons.api.uuid(this.addonService.addonUUID).file('api').func('delete_collections').post(undefined, collections);
    } 

    getRelations(collectionName: String) {
        return this.addonService.papiClient.addons.api.uuid(this.addonService.addonUUID).file('api').func('relation').get({collection: collectionName});
    }

    addRelatedItems(relatedItems) {
        return this.addonService.papiClient.addons.api.uuid(this.addonService.addonUUID).file('api').func('add_items_to_relation').post(undefined, relatedItems);
    }

    deleteRelatedItems(relatedItems: RelationItem[]) {
        return this.addonService.papiClient.addons.api.uuid(this.addonService.addonUUID).file('api').func('remove_items_from_relation').post(undefined, relatedItems);
    }
}