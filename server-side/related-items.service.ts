import { PapiClient, InstalledAddon, Item, ApiFieldObject, AddonData, } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { Collection, RelationItem, RelationItemWithExternalID, ItemWithImageURL, COLLECTION_TABLE_NAME, RELATED_ITEM_CPI_META_DATA_TABLE_NAME, RELATED_ITEM_META_DATA_TABLE_NAME, RELATED_ITEM_ATD_FIELDS_TABLE_NAME } from './entities'

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

    //Updates RELATED_ITEM_CPI_META_DATA_TABLE_NAME Table to be identical to RELATED_ITEM_META_DATA_TABLE_NAME Table
    async trigeredByPNS(body) {
        let items: AddonData[] = [];
        for (const object of body.Message.ModifiedObjects) {
            let relation = await this.getRelationWithExternalIDByKey({ 'Key': object.ObjectKey })
            if (relation != undefined) {
                let itemUUID = await this.getItemsFilteredByFields([relation.ItemExternalID], ['UUID']).then(objs => objs[0].UUID);
                let relatedItemsUUIDs: any = await this.getItemsFilteredByFields(relation.RelatedItems, ['UUID']);
                if (relatedItemsUUIDs) {
                    relatedItemsUUIDs = relatedItemsUUIDs.map(item => item.UUID);
                }
                let key = `${relation.CollectionName}_${itemUUID}`;
                let cpiRelationItem = { 'Key': key, 'Hidden': relation.Hidden, RelatedItems: relatedItemsUUIDs }
                items.push(await this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_CPI_META_DATA_TABLE_NAME).upsert(cpiRelationItem));
            }
        }
        return items;
    }

    //Collection table functions
    async getCollections(query) {
        const { Name, ...options } = query;
        let collectionArray;
        if (query.Name) {
            try {
                collectionArray = [await this.papiClient.addons.data.uuid(this.addonUUID).table(COLLECTION_TABLE_NAME).key(Name).get()];
            }
            catch {
                collectionArray = [];
            }
        }
        else {
            collectionArray = await this.papiClient.addons.data.uuid(this.addonUUID).table(COLLECTION_TABLE_NAME).find(options)
        }

        if (query.fields && !query.fields.includes('Count')) {
            return collectionArray;
        }
        else {
            const array = collectionArray.map(collection => {
                return this.getRelationsItemsWithExternalID({ 'CollectionName': collection.Name }).then(relationsArray => collection.Count = relationsArray?.length);
            })
            await Promise.all(array);
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

            let relatedItems = await this.getRelationsItemsWithExternalID({ 'CollectionName': collectionToDelete.Name });
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

    async deleteRelations(body: RelationItem[]) {
        let relations = body.map(relationToDelete => {
            relationToDelete.Hidden = true;
            return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_META_DATA_TABLE_NAME).upsert(relationToDelete);
        })
        const p = await Promise.all(relations);
        return p
    }

    async checkIfItemsExist(items: string[]) {
        let notExistItems: string[] = [];
        for (const item of items) {
            //Check if the item exists in the user's items list
            let items = await this.getItemsFilteredByFields([item], ['UUID']);
            if (items.length == 0) {
                notExistItems.push(item);
            }
        }
        return notExistItems;
    }

    async addItemsToRelationWithExternalID(body: RelationItemWithExternalID) {
        let itemsToAdd = body.RelatedItems ? body.RelatedItems : [];
        let numberOfItemsToAdd = itemsToAdd.length;
        let failedItemsList: string[] = await this.checkIfItemsExist(itemsToAdd);
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
                    await this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_META_DATA_TABLE_NAME).upsert(item)
                }
                else {
                    await this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_META_DATA_TABLE_NAME).upsert(body)
                }
                let numberOfFailures = failedItemsList.length;
                let numberOfSuccess = numberOfItemsToAdd - numberOfFailures;
                return { numberOfItemsToAdd: numberOfItemsToAdd, numberOfFailures: numberOfFailures, numberOfSuccess: numberOfSuccess, failedItemsList: failedItemsList }
            }
            throw new Error(`Collection does not exist`);
        }
        else {
            throw new Error(`CollectionName and ItemExternalID are required`);
        }
    }

    async removeItemsFromRelationWithExternalID(body: { 'CollectionName': string, 'ItemExternalID': string, 'itemsToRemove': string[] }) {
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
        let externelIDsList = '(' + itemsExternalIDs.map(id => `'${id}'`).join(',') + ')';
        let query = { fields: fields, where: `ExternalID IN ${externelIDsList}` }
        return await this.papiClient.items.find(query)
    }

    async getItems(query) {
        let item:

            {
                'PresentedItem': ItemWithImageURL,
                'RelatedItems': ItemWithImageURL[]
            } = {} as {
                'PresentedItem': ItemWithImageURL,
                'RelatedItems': ItemWithImageURL[]
            };

        item.PresentedItem = await this.getItemsFilteredByFields([query.ExternalID], ['Name', 'LongDescription', 'Image', 'ExternalID']).then(objs => objs[0]);
        item.PresentedItem.ImageURL = item.PresentedItem.Image?.URL;
        let relation = await this.getRelationWithExternalIDByKey({ 'Key': `${query.CollectionName}_${query.ExternalID}` })

        if (relation && relation.RelatedItems && relation.RelatedItems.length > 0) {
            item.RelatedItems = await this.getItemsFilteredByFields(relation.RelatedItems, ['Name', 'LongDescription', 'Image', 'ExternalID']);
            item.RelatedItems.map(item => item.ImageURL = item.Image?.URL)
        }
        return item;
    }

    // ATD functions

    async getItemsFromFieldsTable(options: any = {}): Promise<any> {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_ATD_FIELDS_TABLE_NAME).find(options);
    }

    async upsertItemsInFieldsTable(obj: any): Promise<any> {
        obj.Key = obj.APIName;
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_ATD_FIELDS_TABLE_NAME).upsert(obj);
    }

    async deleteAtdFields(body) {
        const atdID = body.atdID ? Number(body.atdID) : -1;
        const url = `/meta_data/transaction_lines/types/${atdID}/fields`;
        let fields: any[] = [];
        for (let field of body.fields) {
            const fieldID = field.APIName ? field.APIName : "";
            const apiField = await this.papiClient.get(`/meta_data/transaction_lines/types/${atdID}/fields/${fieldID}`)
            apiField.Hidden = true;
            if (await this.papiClient.post(url, apiField)) {
                field.Hidden = true;
                let ans = await this.upsertItemsInFieldsTable(field);
                fields.push(ans);
            }
        }
        return fields
    }

    async createAtdTransactionLinesFields(body): Promise<boolean> {
        const atdID = body.atdID ? Number(body.atdID) : -1;
        const apiName = body.apiName ? body.apiName : "";
        const name = body.name ? body.name : "";

        let field: ApiFieldObject =
        {
            FieldID: apiName,
            Label: name,
            Description: name,
            IsUserDefinedField: true,
            UIType: {
                ID: 54,
                Name: "TextBox",
            },
            Type: "String",
            Format: "String",
            UserDefinedTableSource: null,
            CalculatedRuleEngine: null,
            TypeSpecificFields: null,
            Hidden: false
        }

        const url = `/meta_data/transaction_lines/types/${atdID}/fields`;
        return await this.papiClient.post(url, field);
    }
}

export default RelatedItemsService;