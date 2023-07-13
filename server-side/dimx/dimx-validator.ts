import { SearchBody, SearchData } from '@pepperi-addons/papi-sdk'
import { PapiClient, AddonData } from '@pepperi-addons/papi-sdk'
import RelatedItemsService from '../related-items.service';
import { Collection } from '../../shared/entities'

export class DimxValidator {
    maxNumOfRelatedItems = 25;
    maxChunkSize = 500;
    existingItemsMap: Map<string, Boolean> = new Map<string, Boolean>();

    constructor(private papiClient: PapiClient, private relatedItemsService: RelatedItemsService, private dimxObjects) {
    }

    private async loadColllections() {
        const collectionsMap: Map<string, Boolean> = this.getDistinctCollections();
        await this.createCollection(collectionsMap);
    }

    private async createCollection(collectionsMap: Map<string, Boolean>) {
        let collectionArray: [string, Boolean][] = Array.from(collectionsMap);
        collectionArray.map(async collection => {
            let newCollection: Collection = {
                Name: collection[0],
                Description: "",
                Hidden: false
            }
            await this.relatedItemsService.upsertRelatedCollection(newCollection);
        });
        Promise.all(collectionArray);
    }

    // call items api, and set in a map if item is exist or not
    private async loadItems() {
        //array to save all items in the list in order to search if they exist 
        const allItems = this.getItemsArrayFromDimxObject();
        // to ensure that duplicated items will be removed.
        this.initItemsMap(allItems);
        // a map to save all the items in the dimx object that existing in the user stock
        return await this.validateItemsAvailablitiy();
    }

    // every dimxObject is a related item object
    private validateDimxObjItem(dimxObj) {
        console.log("***dimxObj inside validateDimxObjItem: ", dimxObj);
        if (this.isItemExist(dimxObj.Object.ItemExternalID)) {
            this.handlePrimaryItem(dimxObj);
            this.validateRelatedItems(dimxObj);
        }
        else {
            console.log("item doesn't exist: ", dimxObj.Object.ItemExternalID);
            const errMsg = `${JSON.stringify(dimxObj.Object.ItemExternalID)} failed with the following error: ItemExternalID does not exist`;
            this.markItemAsError(dimxObj, errMsg)
        }
        return dimxObj;
    }

    private validateRelatedItems(dimxObj) {
        console.log("***dimxObj inside validateRelatedItems: ", dimxObj);
        // handeling restriction on related items list
        if(dimxObj.Object.RelatedItems != undefined) {
            dimxObj.Object.RelatedItems.forEach((item, index) => {
                ////Check if the item try to reference itself
                if (item === dimxObj.Object.ItemExternalID) dimxObj.Object.RelatedItems.splice(index, 1);
                // if the user does not have the item, delete it from the list 
                if (!this.isItemExist(item)) {
                    dimxObj.Object.RelatedItems.splice(index, 1);
                }
            });
        }
        // no more than 25(maxNumOfRelatedItems) related items
        if (dimxObj.Object.RelatedItems.length > this.maxNumOfRelatedItems) {
            dimxObj.Object.RelatedItems.splice(0, this.maxNumOfRelatedItems - 1);
        }
        return dimxObj;
    }

    // add key and hidden state for the primary item
    private handlePrimaryItem(dimxObj) {
        dimxObj.Object.Hidden = false
        dimxObj.Object.Key = `${dimxObj.Object.CollectionName}_${dimxObj.Object.ItemExternalID}`;
    }

    private markItemAsError(dimxObj, errorMsg: string) {
        dimxObj.status = Error;
        dimxObj.Details = errorMsg;
    }

    async handleDimxObjItem() {
        await Promise.all([this.loadItems(), this.loadColllections()]);
        // get the dimxobject and return object that meets the restriction :
        // * the main item and all the related items are exist
        // * no more than 25 related items
        // * not pointing to itself 
        return this.dimxObjects.map(dimxObj => dimxObj = this.validateDimxObjItem(dimxObj));
    }

    private initItemsMap(allItems) {
        allItems.map(item => {
            this.existingItemsMap.set(item, false);
        });
    }

    private async validateItemsAvailablitiy() {
        // convert items map into array in order to split to chunk and search
        let allItems = Array.from(this.existingItemsMap.keys());
        // split array into chunks in order to call multiple searches simultaneously
        const chunks = this.splitToChunks(allItems, this.maxChunkSize);
        await Promise.all(chunks.map(async chunk => {
            let searchBody: SearchBody = {
                Fields: [
                    "ExternalID"
                ],
                UniqueFieldID: "ExternalID",
                UniqueFieldList: [...chunk]
            }
            const items = await this.search('items', searchBody)
            for (var item of items.Objects) {
                this.existingItemsMap.set(item.ExternalID, true)
            }
        }))
    }

    // creates an array of all the items that arrived in dimxObject
    private getItemsArrayFromDimxObject() {
        const items: any[] = [];
        // add the primary item  
        const itemExternalIDs = this.dimxObjects.map(dimxObj => dimxObj.Object.ItemExternalID);
        const relatedItems = this.dimxObjects.flatMap(dimxObj => dimxObj.Object.RelatedItems);
        items.push(...itemExternalIDs, ...relatedItems);

        return items;
    }

    // creates an array of all the collections that arrived in dimxObject
    private getDistinctCollections() {
        let collectionsMap: Map<string, Boolean> = new Map<string, Boolean>();
        this.dimxObjects.map(dimxObj => {
            collectionsMap.set(dimxObj.Object.CollectionName, true);
        });
        return collectionsMap;
    }

    private isItemExist(item) {
        return this.existingItemsMap.get(item) == true
    }

    // get list of all items and returns the existing items it Items resource
    private async search(resourceName: string, params: SearchBody): Promise<SearchData<AddonData>> {
        return (await this.papiClient.resources.resource(resourceName).search(params));
    }

    // gets an array of items and max chuck size and splits the array of items to chunks according to the max chunk size
    private splitToChunks<T>(items: T[], maxKeysInChunk: number): T[][] {
        const numberOfKeys = items.length;
        const res: T[][] = []

        // get the number of chunks with no more than max keys in chunk
        const numberOfChunks = Math.ceil(numberOfKeys / maxKeysInChunk);

        // calculating equally the number of keys in every chunk
        const keysInChunk = Math.ceil(numberOfKeys / numberOfChunks)

        // splitting the array of keys to the desired chunks
        for (let i = 0; i < numberOfKeys; i += keysInChunk) {
            res.push(items.slice(i, i + keysInChunk));
        }

        console.log(`sliceKeysToChunks from ${items.length} keys to ${res.length} chunks`)
        return res;
    }
}