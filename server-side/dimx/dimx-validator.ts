import { SearchBody, SearchData } from '@pepperi-addons/papi-sdk'
import { PapiClient, AddonData } from '@pepperi-addons/papi-sdk'
import RelatedItemsService from '../related-items.service';
import { Collection } from '../../shared/entities'
import { Item } from '@pepperi-addons/cpi-node/build/cpi-side/app/entities';

export class DimxValidator {
    maxNumOfRelatedItems = 25;
    existingItemsMap: Map<string, Boolean> = new Map<string, Boolean>();
    collectionsMap: Map<string, Boolean> = new Map<string, Boolean>();

    constructor(private papiClient: PapiClient, private relatedItemsService: RelatedItemsService, private dimxObjects) {
    }

    async loadItems() {
        this.createCollectionsArrayFromDimxObject();
        // call items api, and set in a map if item is exist or not
        await this.createExistingItemsList()
    }

    async initCollections() {
        this.createCollectionsArrayFromDimxObject()
        await this.createCollectionIfNeed(this.collectionsMap);
    }

    async createCollectionIfNeed(collectionsMap: Map<string, Boolean>) {
        let collectionArray: [string, Boolean][] = Array.from(collectionsMap);
        collectionArray.map(async collection => {
            let newCollection: Collection = {
                Name: collection[0],
                Description: "",
                Hidden: false
            }
            await this.relatedItemsService.upsertRelatedCollection(newCollection);
        });
    }

    // call items api, and set in a map if item is exist or not
    async createExistingItemsList() {
        //array to save all items in the list in order to search if they exist 
        const allItems = this.createItemsArrayFromDimxObject(this.dimxObjects);
        // a map to save all the items in the dimx object that existing in the user stock
        return await this.createExistingItemsMap(allItems);
    }

    validateDimxObjItem(dimxObj) {
        let primaryItem = dimxObj.Object.ItemExternalID
        this.validatePrimaryItem(primaryItem, dimxObj)
        this.validateRelatedItems(dimxObj, primaryItem)
        console.log("dimxObj After Validate: ", dimxObj);
        return dimxObj;
    }

    validateRelatedItems(dimxObj, primaryItem) {
        // handeling restriction on related items list
        dimxObj.Object.RelatedItems.forEach(async (item, index) => {
            ////Check if the item try to reference itself
            if (item === primaryItem) dimxObj.Object.RelatedItems.splice(index, 1);
            // if the user does not have the item, delete it from the list 
            if (!this.isItemExist(item)) {
                dimxObj.Object.RelatedItems.splice(index, 1);
            }
        });
        // no more than 25(maxNumOfRelatedItems) related items
        if (dimxObj.Object.RelatedItems.length > this.maxNumOfRelatedItems) {
            dimxObj.Object.RelatedItems.splice(0, this.maxNumOfRelatedItems - 1);
        }
        return dimxObj;
    }

    validatePrimaryItem(ItemExternalID: string, dimxObj) {
        // add key and hidden state for the primary item
        if (this.isItemExist(ItemExternalID)) {
            dimxObj.Object.Hidden = false
            dimxObj.Object.Key = `${dimxObj.Object.CollectionName}_${dimxObj.Object.ItemExternalID}`;
        }
    }

    handleDimxObjItem() {
        // get the dimxobject and return object that meets the restriction :
        // the main item and all the related items are exist
        // * no more than 25 related items
        // * not pointing to itself 
        return this.dimxObjects.map(dimxObj => dimxObj = this.validateDimxObjItem(dimxObj));
    }

    async createExistingItemsMap(allItems: any[]) {
        // split array into chunks in order to call multiple searches simultaneously 
        const chunks = this.splitToChunks(allItems, 500);

        const requests = chunks.map(chunk => {
            let searchBody: SearchBody = {
                Fields: [
                    "ExternalID"
                ],
                UniqueFieldID: "ExternalID",
                UniqueFieldList: [...chunk]
            }

            return this.search('items', searchBody).then(items => {
                console.log("***items from search", items);
                for (var item of items.Objects) {
                    this.existingItemsMap.set(item.ExternalID, true)
                }
            });
        })
        await Promise.all(requests);
    }

    // creates an array of all the items that arrived in dimxObject
    createItemsArrayFromDimxObject(dimxObjects) {
        const items: any[] = [];
        // add the primary item  
        const itemExternalIDs = dimxObjects.map(dimxObj => dimxObj.Object.ItemExternalID);
        const relatedItems = dimxObjects.flatMap(dimxObj => dimxObj.Object.RelatedItems);
        items.push(...itemExternalIDs, ...relatedItems);

        return items;
    }

    // creates an array of all the collections that arrived in dimxObject
    createCollectionsArrayFromDimxObject() {
        this.dimxObjects.map(dimxObj => {
            this.collectionsMap.set(dimxObj.Object.CollectionName, true);
        });
    }

    isItemExist(item) {
        return this.existingItemsMap.get(item) == true
    }

    // get list of all items and returns the existing items it Items resource
    async search(resourceName: string, params: SearchBody): Promise<SearchData<AddonData>> {
        return (await this.papiClient.resources.resource(resourceName).search(params));
    }

    // gets an array of items and max chuck size and splits the array of items to chunks according to the max chunk size
    splitToChunks<T>(items: T[], maxKeysInChunk: number): T[][] {
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