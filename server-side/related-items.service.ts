import { PapiClient, InstalledAddon, Item } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { Collection, RelationItem, RelationItemWithExternalID, ItemWithImageURL, COLLECTION_TABLE_NAME, RELATED_ITEM_CPI_META_DATA_TABLE_NAME, RELATED_ITEM_META_DATA_TABLE_NAME } from './entities'

class RelatedItemsService {

    papiClient: PapiClient
    addonUUID: string;

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client["ActionUUID"]
        });

        this.addonUUID = client.AddonUUID;
    }

    createPNSSubscription() {
        return this.papiClient.notification.subscriptions.upsert({
            AddonUUID: this.addonUUID,
            AddonRelativeURL: "/api/triggered_by_pns",
            Type: "data",
            Name: "subscriptionToRelatedItems",
            FilterPolicy: {
                Action: ['update'],
                Resource: [RELATED_ITEM_META_DATA_TABLE_NAME],
                AddonUUID: [this.addonUUID]
            }
        });
    }

    async trigeredByPNS(body) {
        for (const object of body.Message.ModifiedObjects) {
            let relation = await this.getRelationWithExternalIDByKey({'Key': object.ObjectKey})
            if (relation != undefined ) {
                let itemUUID = await this.getItemsFilteredByFields([relation.ItemExternalID], ['UUID']).then(objs => objs[0].UUID);
                let relatedItemsUUIDs: any = await this.getItemsFilteredByFields(relation.RelatedItems, ['UUID']);
                if(relatedItemsUUIDs) {
                    relatedItemsUUIDs = relatedItemsUUIDs.map(item => item.UUID);
                }
                let key = `${relation.CollectionName}_${itemUUID}`;
                let cpiRelationItem = { 'Key': key, 'Hidden': relation.Hidden, RelatedItems: relatedItemsUUIDs }
                return await this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_CPI_META_DATA_TABLE_NAME).upsert(cpiRelationItem);
            }
        }
    }

    //Collection table functions
    async getCollections(query) {
        let collectionArray;
        if (query.Name) {
            collectionArray = await this.papiClient.addons.data.uuid(this.addonUUID).table(COLLECTION_TABLE_NAME).find({ where: `Name='${query.Name}'` })
        }
        else {
            collectionArray = await this.papiClient.addons.data.uuid(this.addonUUID).table(COLLECTION_TABLE_NAME).find({})
        }
         

        if (query.fields && !query.fields.includes('Count')) {
            return collectionArray;
        }
        else {
            for (const collection of collectionArray) {
                const relationsArray = await this.getRelationsItemsWithExternalID({ 'CollectionName': collection.Name });
                if (relationsArray) {
                    collection.Count = relationsArray.length;
                }
            }
            return collectionArray;
        }
    }

    async getCollectionByKey(key: string) {
        return this.papiClient.addons.data.uuid(this.addonUUID).table(COLLECTION_TABLE_NAME).key(key).get();
    }

    upsertRelatedCollection(body: Collection) {
        if (body.Name) {
            body.Key = body.Name;
            return this.papiClient.addons.data.uuid(this.addonUUID).table(COLLECTION_TABLE_NAME).upsert(body);
        }
        else {
            throw new Error(`Name is required`);
        }
    }

    async deleteCollections(body: [Collection]) {
        for (const collectionToDelete of body) {
            collectionToDelete.Hidden = true;

            let relatedItems = await this.getRelationsItemsWithExternalID({'CollectionName': collectionToDelete.Name});
            if (relatedItems) {
                this.deleteRelations(relatedItems as any);
            }
            await this.upsertRelatedCollection(collectionToDelete);
        }
        return body;
    }

    // RELATED_ITEM_META_DATA_TABLE_NAME endpoints

    async getRelationWithExternalIDByKey(body: RelationItemWithExternalID) {
        if (body.Key === undefined) {
            body.Key = `${body.CollectionName}_${body.ItemExternalID}`;
        }
        try {
            return await this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_META_DATA_TABLE_NAME).key(body.Key).get();
        }
        catch (error) {
            return;
        }
    }

    async getRelationsItemsWithExternalID(body: RelationItemWithExternalID) {
        if (!body.CollectionName) {
            throw new Error(`CollectionName is required`);
        }
        if (!body.ItemExternalID) {
            return await this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_META_DATA_TABLE_NAME).find({ where: `Key like '${body.CollectionName}_%'` });
        }
        else {
            return await this.getRelationWithExternalIDByKey(body)
        }
    }

    async deleteRelations(body: [RelationItem]) {
        let relations = body.map(relationToDelete => {
            relationToDelete.Hidden = true;
            return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_META_DATA_TABLE_NAME).upsert(relationToDelete);
        })
        const p = await Promise.all(relations);
        return relations
    }
    

    async addItemsToRelationWithExternalID(body: RelationItemWithExternalID) {
        //validate that the required fields exist
        if (body.CollectionName && body.ItemExternalID) {
            let collection = await this.getCollectionByKey(body.CollectionName);
            if (collection) {
                let item = await this.getRelationWithExternalIDByKey(body);
                // if the RealationItem exists - adds new Relateditems to the item's relatedItems array, else creates new RealationItem
                if (item) {
                    if (item.RelatedItems) {
                        item.RelatedItems = item.RelatedItems.concat(body.RelatedItems ?? []);
                    }
                    else {
                        item.RelatedItems = body.RelatedItems;
                    }
                    return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_META_DATA_TABLE_NAME).upsert(item)
                }
                else {
                    return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_META_DATA_TABLE_NAME).upsert(body)
                }
            }
            throw new Error(`Collection does not exist`);
        }
        else {
            throw new Error(`CollectionName and ItemExternalID are required`);
        }
    }

    async removeItemsFromRelationWithExternalID(body: {'CollectionName': string, 'ItemExternalID': string, 'itemsToRemove': string[]}) {
        let itemsToRemove = body.itemsToRemove;
        if (itemsToRemove) {
            if (body.CollectionName && body.ItemExternalID) {
                let item = await this.getRelationWithExternalIDByKey(body);
                if (item) {
                    item.RelatedItems = await this.deleteItemsFromGivenArray(itemsToRemove, item.RelatedItems);

                    return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_META_DATA_TABLE_NAME).upsert(item);
                }
                else {
                    throw new Error(`Relation does not exist`);
                }
            }
            else {
                throw new Error(`CollectionName and ItemExternalID are required`);
            }
        }
    }

    deleteItemsFromGivenArray(itemsToRemove: string[], array: string[]) {
        itemsToRemove.sort();

        for (let index = 0; index < array.length; index++) {
            if (itemsToRemove.includes(array[index])) {
                array.splice(index, 1);
                index--;
            }
        }
        return array;
    }

    // Items functions

    async getItemsFilteredByFields(itemsExternalIDs, fields) {
        let externelIDsList = '(' + itemsExternalIDs.map(date => `'${date}'`).join(',') + ')';
        let query = {fields: fields, where: `ExternalID IN ${externelIDsList}`}
        return await this.papiClient.items.find(query)
    }

    async getItems(query) {
        let item : { 
            'PresentedItem': Item,
            'RelatedItems': ItemWithImageURL[]
        } = {} as { 
            'PresentedItem': Item,
            'RelatedItems': ItemWithImageURL[]
        };

        item.PresentedItem = await this.getItemsFilteredByFields([query.ExternalID], ['Name', 'LongDescription','Image','ExternalID']).then(objs => objs[0]);
        let relation = await this.getRelationWithExternalIDByKey({'Key': `${query.CollectionName}_${query.ExternalID}`})
        
        if(relation && relation.RelatedItems && relation.RelatedItems.length > 0) {
            item.RelatedItems = await this.getItemsFilteredByFields(relation.RelatedItems, ['Name', 'LongDescription','Image','ExternalID']);
            item.RelatedItems.map(item => item.ImageURL = item.Image?.URL)
        }
        return item;
    }
}

export default RelatedItemsService;