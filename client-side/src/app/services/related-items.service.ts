import { AddonService } from "../components/addon";
import { Injectable } from '@angular/core';
import { Collection, RelationItem } from '../../../../server-side/entities';

@Injectable({
    providedIn: 'root'
})

export class RelatedItemsService {

    constructor(
        private addonService: AddonService
    )  {
          
    }

    getCollections(collectionName?: string) {
        let url = `/addons/api/${this.addonService.addonUUID}/api/collections`
        if (collectionName) {
            url = url + `?Name=${collectionName}`;
        }
        return this.addonService.pepGet(encodeURI(url)).toPromise();
    }

    saveCollection(collection) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/collections`, collection).toPromise();
    }

    deleteCollections(collections: Collection[]) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/delete_collections`, collections).toPromise();
    }

    getRelations(collectionName: string) {
        let url = `/addons/api/${this.addonService.addonUUID}/api/relation?` + `CollectionName=${collectionName}`;
        return this.addonService.pepGet(encodeURI(url)).toPromise();
    }

    deleteRelations(relation: RelationItem[]) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/delete_relations`, relation).toPromise();
    }

    addRelatedItems(relatedItems) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/add_items_to_relation_with_externalid`, relatedItems).toPromise();
    }

    deleteRelatedItems(itemToUpdate) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/remove_items_from_relation_with_externalid`, itemToUpdate).toPromise();
    }

    getItemsInCollection(collectionName: string, relationExternalId: string) {
        let url = `/addons/api/${this.addonService.addonUUID}/api/get_items?` + `CollectionName=${collectionName}&ExternalID=${relationExternalId}`;
        return this.addonService.pepGet(encodeURI(url)).toPromise();
    }

    getItemsWithExternalId(externalID: string) {
        return this.addonService.papiClient.items.find({fields:['UUID'], where: `ExternalID like '${externalID}'` });
    }
}