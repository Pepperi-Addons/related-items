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
            let key = this.generateRelationItemKey({
                'CollectionName': body.collection,
                'ItemUUID': body.item
            });
            return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATION_TABLE_NAME).find({ where: `Key like '${key}%'` });
        }
    }

    async addItemsToRelation(body: RelationItem) {
        //validate that the required fields exist
        if (body.CollectionName && body.ItemUUID) {
            body.Key = this.generateRelationItemKey(body);

            let collection = await this.getCollections({ where: `Name = '${body.CollectionName}'` });
            if (collection.length > 0) {
                // if the RealationItem exists - adds new Relateditems to the item's relatedItems array, else creates new RealationItem
                let items = await this.getRelationsItems({ collection: body.CollectionName, item: body.ItemUUID });
                if (items && items.length > 0) {
                    if (items[0].RelatedItems) {
                        items[0].RelatedItems = items[0].RelatedItems.concat(body.RelatedItems);
                    }
                    else {
                        items[0].RelatedItems = body.RelatedItems;
                    }
                    return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATION_TABLE_NAME).upsert(items[0])
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
                let items = await this.getRelationsItems({ collection: body.CollectionName, item: body.ItemUUID });
                if (items && items.length > 0) {
                    items[0].RelatedItems = await this.deleteItemsFromGivenArray(itemsToRemove, items[0].RelatedItems);

                    return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATION_TABLE_NAME).upsert(items[0]);
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

    deleteItemsFromGivenArray(itemsToRemove: [string], array: [string]) {
        array.sort();
        itemsToRemove.sort();

        for (let index = 0; index<array.length; index++) {
            if (itemsToRemove.includes(array[index])) {
                array.splice(index, 1);
            }
        }
        return array;
    }
}

export default RelatedItemsService;