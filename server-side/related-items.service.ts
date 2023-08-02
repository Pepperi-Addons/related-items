import { PapiClient, ApiFieldObject, AddonData, FindOptions, SearchBody, SearchData } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { Collection, ItemRelations, RelationItemWithExternalID, ItemWithImageURL, COLLECTION_TABLE_NAME, RELATED_ITEM_CPI_META_DATA_TABLE_NAME, RELATED_ITEM_META_DATA_TABLE_NAME, RELATED_ITEM_ATD_FIELDS_TABLE_NAME, exportAnswer } from '../shared/entities'
import { DimxValidator } from './dimx/dimx-validator'

class RelatedItemsService {

    maximumNumberOfRelatedItems = 25;

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
                Action: ['update', 'insert'],
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
                relatedItemsUUIDs = relatedItemsUUIDs.map(item => item.UUID);

                let key = `${relation.CollectionName}_${itemUUID}`;
                let cpiRelationItem = { 'Key': key, 'Hidden': relation.Hidden, RelatedItems: relatedItemsUUIDs }
                items.push(await this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_CPI_META_DATA_TABLE_NAME).upsert(cpiRelationItem));
            }
        }
        return items;
    }

    //Collection table functions
    async getCollections(query): Promise<any> {
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

    async getRelatedItems(query) {
        if (query && query.resource_name == 'related_items'){
            return await this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_META_DATA_TABLE_NAME).find(query);
        } else {
            throw new Error(`resource name is not related_items`);
        }        
    }
    
    async upsertItemRelations(body: RelationItemWithExternalID) {
        if (body.Hidden == true) {
            return await this.deleteRelations([body]);
        }
        else {
            await this.addItemsToRelationWithExternalID(body);
            // The key was updated when inserting the item into the table
            return await this.getItemRelationEntity(body.Key!);
        }
    }

    async getRelationsItemsWithExternalID(body: RelationItemWithExternalID) {
        if (!body.CollectionName) {
            throw new Error(`CollectionName is required`);
        }
        if (!body.ItemExternalID) {
            return await this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_META_DATA_TABLE_NAME).find({ where: `Key like '${body.CollectionName}_%'` , page_size: -1 });
        }
        else {
            return await this.getRelationWithExternalIDByKey(body)
        }
    }

    // Generic resource  - get a single resource entity by key
    async getItemRelationEntity(key: string) {
        if (!key) {
            throw new Error(`Key is required`);
        }
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_META_DATA_TABLE_NAME).key(key).get();
    }

    async deleteRelations(body: ItemRelations[]) {
        let relations = body.map(relationToDelete => {
            relationToDelete.RelatedItems = [];
            relationToDelete.Hidden = true;
            return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_META_DATA_TABLE_NAME).upsert(relationToDelete);
        })
        const p = await Promise.all(relations);
        return p
    }

    async addItemsToRelationWithExternalID(body: RelationItemWithExternalID) {
        // mandatory fields
        if (body.CollectionName && body.ItemExternalID && body.RelatedItems) {
            this.validateItemExternalID(body.ItemExternalID);
            let collection = await this.upsertRelatedCollection({ "Name": body.CollectionName });
            if (collection) {
                let item = await this.getRelationWithExternalIDByKey(body);

                let itemsToAdd = body.RelatedItems ? body.RelatedItems : [];
                let numberOfItemsToAdd = itemsToAdd.length;

                let notExistItems: string[] = [];
                let isTryToReferencItself = false;
                let dupicateItems: string[] = [];

                for (const itemToAdd of itemsToAdd) {
                    //Check if the related items exist in the user's items list
                    let items = await this.getItemsFilteredByFields([itemToAdd], ['UUID']);
                    if (items.length == 0) {
                        notExistItems.push(itemToAdd);
                    }

                    //Check if the item try to reference itself
                    if (itemToAdd == body.ItemExternalID) {
                        isTryToReferencItself = true;
                    }

                    //Check if one of the related items is already in the list
                    if (item?.RelatedItems?.includes(itemToAdd)) {
                        dupicateItems.push(itemToAdd);
                    }
                }

                //Delete items that should not be added
                if (body.RelatedItems) {
                    body.RelatedItems = body.RelatedItems.filter(item => !notExistItems.includes(item))
                    body.RelatedItems = body.RelatedItems.filter(item => !dupicateItems.includes(item))
                    body.RelatedItems = body.RelatedItems.filter(item => !(item == body.ItemExternalID))

                    numberOfItemsToAdd = numberOfItemsToAdd - dupicateItems.length;
                }

                //Check if the list is in full capacity.
                if (!item) {
                    item = body;
                    item.RelatedItems = [];
                }
                let exceedingItems = await this.checkIfTheListIsFull(item, body.RelatedItems);

                return this.handleAddAns(dupicateItems, notExistItems, isTryToReferencItself, exceedingItems, numberOfItemsToAdd);

            }
            else {
                throw new Error(`Collection does not exist`);
            }
        }
        else {
            throw new Error(`One or more of the following fields are missing: CollectionName, ItemExternalID, RelatedItems`);
        }
    }

    async validateItemExternalID(itemExternalID: string) {
        const primaryItem = await this.papiClient.items.find({ fields: ['UUID'], where: `ExternalID like '${itemExternalID}'` });
        if (primaryItem.length == 0) {
            throw new Error(`ExternalID does not exist`);
        }
    }

    // check if the number related items higher than maximumNumberOfRelatedItems
    async checkIfTheListIsFull(item, relatedItems) {
        let exceededItems = [];
        item.RelatedItems = item.RelatedItems.concat(relatedItems ?? []);
        //limit the number of related items for each item to maximumNumberOfRelatedItems
        let numberOfRelatedItems = item.RelatedItems.length;
        if (numberOfRelatedItems > this.maximumNumberOfRelatedItems) {
            //Save failed items for user message
            exceededItems = item.RelatedItems.slice(this.maximumNumberOfRelatedItems, numberOfRelatedItems)
            item.RelatedItems = item.RelatedItems.slice(0, this.maximumNumberOfRelatedItems);
        }
        item.Hidden = false;
        await this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_META_DATA_TABLE_NAME).upsert(item);
        return exceededItems;
    }

    handleAddAns(dupicateItems, notExistItems, isTryToReferencItself, exceedingItems, numberOfItemsToAdd) {
        let returnMessage = "";

        if (exceedingItems.length > 0) {
            returnMessage = `The list is in full capacity. The following items were not added: ${exceedingItems}`;
        }
        else if (notExistItems.length > 0 && isTryToReferencItself) {
            returnMessage = `The following items were not added: ${notExistItems}`;
        }
        else if (isTryToReferencItself) {
            returnMessage = `An item cannot reference itself`;
        }
        else if (notExistItems.length > 0) {
            let numberOfFailures = notExistItems.length;
            let numberOfSuccess = numberOfItemsToAdd - numberOfFailures;
            if (numberOfSuccess > 0) {
                returnMessage = `${numberOfSuccess} items were added. The following items failed: ${notExistItems}. Please verify the ids and that the items are not deleted”`;
            }
            else {
                if (dupicateItems.length >= 0) {
                    returnMessage = `Failed to add items Please verify the ids and that the items are not deleted`;
                }
                else {
                    returnMessage = `The following items were not added: ${notExistItems}`;
                }

            }
        }
        else {
            if (dupicateItems.length <= 0) {
                returnMessage = `${numberOfItemsToAdd} items were added`;
            }
        }
        return returnMessage;
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
        if (itemsExternalIDs && itemsExternalIDs.length > 0) {
            let externelIDsList = '(' + itemsExternalIDs.map(id => `'${id}'`).join(',') + ')';
            let query = { fields: fields, where: `ExternalID IN ${externelIDsList}` }
            return await this.papiClient.items.find(query)
        }
        return [];
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

    async getItemsFromFieldsTable(options: FindOptions = {}): Promise<any> {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_ATD_FIELDS_TABLE_NAME).find(options);
    }

    async upsertItemsInFieldsTable(obj: any): Promise<any> {
        obj.Key = `${obj.FieldID}_${obj.TypeID}`;
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_ATD_FIELDS_TABLE_NAME).upsert(obj);
    }

    async deleteAtdFields(body) {
        const typeID = body.typeID ? Number(body.typeID) : -1;
        const url = `/meta_data/transaction_lines/types/${typeID}/fields`;
        let fields: any[] = [];
        for (let field of body.fields) {
            const fieldID = field.FieldID ? field.FieldID : "";
            const apiField = await this.papiClient.get(`/meta_data/transaction_lines/types/${typeID}/fields/${fieldID}`)
            apiField.Hidden = true;
            if (await this.papiClient.post(url, apiField)) {
                field.Hidden = true;
                field.TypeID = typeID
                let ans = await this.upsertItemsInFieldsTable(field);
                fields.push(ans);
            }
        }
        return fields
    }

    async createAtdTransactionLinesFields(body) {
        const typeID = body.TypeID ? Number(body.TypeID) : -1;
        const fieldID = body.FieldID ? body.FieldID : "";
        const name = body.Name ? body.Name : "";

        let field: ApiFieldObject =
        {
            FieldID: fieldID,
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

        const url = `/meta_data/transaction_lines/types/${typeID}/fields`;
        if (await this.papiClient.post(url, field)) {
            return this.upsertItemsInFieldsTable(body)
        }
    }

    // Import-Export ATD
    async importATDFields(body) {
        try {
            console.log('importATDFields is called, data got from call:', body);
            if (body && body.Resource == 'transactions') {
                let objectToimport = body.DataFromExport;
                objectToimport.forEach(async obj => {
                    obj.TypeID = body.InternalID;
                    await this.upsertItemsInFieldsTable(obj);
                    await this.createAtdTransactionLinesFields(obj);
                });
            }
            return {
                success: true
            }
        }
        catch (err) {
            console.log('importATDFields Failed with error:', err);
            return {
                success: false,
                errorMessage: err ? err : 'unknown error occured'
            }
        }
    }

    async exportATDFields(query) {
        let objectToReturn: exportAnswer = new exportAnswer(true, {});
        try {
            let fields;
            console.log('exportRelatedItems is called, data got from call:', query);
            if (query && query.resource == 'transactions') {
                fields = await this.getItemsFromFieldsTable()
                fields = fields.filter(field => field.TypeID == query.internal_id && field.Hidden == false);

                if (fields && fields.length > 0) {
                    objectToReturn.DataForImport = fields.map(field => {
                        return {
                            "FieldID": field.FieldID,
                            "Name": field.Name,
                            "ListSource": field.ListSource,
                            "ListType": field.ListType
                        }
                    });
                }
            }
            return objectToReturn;
        }
        catch (err) {
            console.log('exportRelatedItems Failed with error:', err);
            return {
                success: false,
                errorMessage: err ? err : 'unknown error occured'
            }
        }
    }

    //DIMX
    async importDataSource(body) {
        const dimxValidator = new DimxValidator(this.papiClient, this, body.DIMXObjects)
        // checks that the names of the columns are what is required, and returns an error if not
        body.DIMXObjects = await dimxValidator.handleDimxObjItem();
        return body;
    }

    async exportDataSource(body) {
        console.log("Export data is working")
        return body;
    }

    // Usage monitor
    async getNumberOfCollectionsUsageData() {
        const collections = await this.getCollections({});

        return {
            Title: "Data",
            "Resources": [
                {
                    "Data": "Related Items Collections",
                    "Description": "Number of Related Items Collections",
                    "Size": collections.length,
                },
            ],
            "ReportingPeriod": "Weekly",
            "AggregationFunction": "LAST"
        }
    }

    async getTotalNumberOfLinesInCollectionsUsageData() {
        let totalNumberOfLines = 0;
        const collections = await this.getCollections({});
        collections.forEach(element => {
            totalNumberOfLines = totalNumberOfLines + element.Count;

        });

        return {
            Title: "Data",
            "Resources": [
                {
                    "Data": "Related Items Collections Lines",
                    "Description": "Total number of lines in Related Items Collections",
                    "Size": totalNumberOfLines,
                },
            ],
            "ReportingPeriod": "Weekly",
            "AggregationFunction": "LAST"
        }
    }
}

export default RelatedItemsService;
