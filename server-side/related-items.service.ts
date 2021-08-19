import { PapiClient, InstalledAddon } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { v4 as uuid } from 'uuid';
import { Collection, RelationItem, COLLECTION_TABLE_NAME, RELATION_TABLE_NAME } from '../shared/entities'

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

    //Collection table functions
    async getCollections(query) {
        let collectionArray = await this.papiClient.addons.data.uuid(this.addonUUID).table(COLLECTION_TABLE_NAME).find(query)

        if (query.fields && !query.fields.includes('Count')) {
            return collectionArray;
        }
        else {
            for (const collection of collectionArray) {
                const relationsArray = await this.getRelationsItems({ 'collection': collection.Name });
                collection.Count = relationsArray.length;
            }

            return collectionArray;
        }
    }

    async getCollectionByKey(key) {
        let collection = await this.papiClient.addons.data.uuid(this.addonUUID).table(COLLECTION_TABLE_NAME).key(key).get();

        if(key.fields && key.fields.includes('Count')) {
            const relationsArray = await this.getRelationsItems({ 'collection': collection.Name });
            collection.Count = relationsArray.length; 
        }
        return collection;
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

    //Relations table functions
    generateRelationItemKey(item: RelationItem) {
        return `${item.CollectionName}_${item.ItemUUID}`;

    }

    getRelationsItems(body: { collection: string, item?: string }) {
        if (!body.collection) {
            throw new Error(`collection is required`);
        }
        if (!body.item) {
            return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATION_TABLE_NAME).find({ where: `Key like '${body.collection}_%'` });
        }
        else {
            return this.getRelationByKey(body)
        }
    }

    getRelationByKey(body: { collection: string, item?: string }) {
        let key = this.generateRelationItemKey({
            'CollectionName': body.collection,
            'ItemUUID': body.item
        });
        return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATION_TABLE_NAME).key(key).get();
    }

    async addItemsToRelation(body: RelationItem) {
        //validate that the required fields exist
        if (body.CollectionName && body.ItemUUID) {
            body.Key = this.generateRelationItemKey(body);

            let collection = await this.getCollectionByKey(body.CollectionName);
            if (collection) {
                // if the RealationItem exists - adds new Relateditems to the item's relatedItems array, else creates new RealationItem
                let item = await this.getRelationByKey({ collection: body.CollectionName, item: body.ItemUUID })//this.getRelationsItems({ collection: body.CollectionName, item: body.ItemUUID });
                if (item) {
                    if (item.RelatedItems) {
                        item.RelatedItems = item.RelatedItems.concat(body.RelatedItems);
                    }
                    else {
                        item.RelatedItems = body.RelatedItems;
                    }
                    return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATION_TABLE_NAME).upsert(item)
                }
                else {
                    return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATION_TABLE_NAME).upsert(body)
                }
            }
            throw new Error(`Collection does not exist`);
        }
        else {
            throw new Error(`CollectionName and ItemUUID are required`);
        }
    }

    async removeItemsFromRelation(body: RelationItem) {
        let itemsToRemove = body.RelatedItems;
        if (itemsToRemove) {
            if (body.CollectionName && body.ItemUUID) {
                let item = await this.getRelationByKey({ collection: body.CollectionName, item: body.ItemUUID });
                if (item) {
                    item.RelatedItems = await this.deleteItemsFromGivenArray(itemsToRemove, item.RelatedItems);

                    return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATION_TABLE_NAME).upsert(item);
                }
                else {
                    throw new Error(`Relation does not exist`);
                }
            }
            else {
                throw new Error(`CollectionName and ItemUUID is required`);
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
}

export default RelatedItemsService;