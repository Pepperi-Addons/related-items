import { AddonService } from "../components/addon";
import { Injectable } from '@angular/core';
import {Collection} from '../../../../shared/entities';

@Injectable({
    providedIn: 'root'
  })

export class RelatedItemsService {
    
    constructor(private addonService: AddonService) {

    }

    getCollections() {
        return this.addonService.papiClient.addons.api.uuid(this.addonService.addonUUID).file('api').func('collections').get();
    }

    saveCollection(collection) {
        return this.addonService.papiClient.addons.api.uuid(this.addonService.addonUUID).file('api').func('collections').post(undefined, collection);
    }

    getRelations(collectionName: String) {
        return this.addonService.papiClient.addons.api.uuid(this.addonService.addonUUID).file('api').func('relation').get({collection: collectionName});
    }
}