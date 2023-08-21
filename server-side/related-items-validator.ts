import { PapiClient, AddonData, SearchBody, SearchData } from '@pepperi-addons/papi-sdk'
import RelatedItemsService from './related-items.service';
import { Collection, ItemRelations } from 'shared'
import { ItemRelationValidate } from 'shared/entities';
import { ItemsService } from './items-service';

export class RelatedItemsValidator {
    maxNumOfRelatedItems = 25;
    maxChunkSize = 500;
    existingItemsMap: Map<string, boolean> = new Map<string, boolean>();

    constructor(private papiClient: PapiClient, private relatedItemsService: RelatedItemsService, private itemsRelations: ItemRelations[]) {
    }

    async loadData(){
        await Promise.all([this.loadItems(), this.loadColllections()]);
    }
    validate(itemRelation: ItemRelations): ItemRelationValidate {
        // get the dimxobject and return object that meets the restriction :
        // * the main item and all the related items are exist
        // * no more than 25 related items
        // * not pointing to itself
        return this.handleItemRelation(itemRelation);
    }

    // add key and hidden state for the primary item
    private handlePrimaryItem(itemRelation: ItemRelations) {
        itemRelation.Hidden = itemRelation.Hidden ? itemRelation.Hidden : false
        itemRelation.Key = `${itemRelation.CollectionName}_${itemRelation.ItemExternalID}`;
    }

    private handleItemRelation(itemRelation: ItemRelations): ItemRelationValidate {
        let msgError: string | undefined = undefined;
        const schemeValidation = this.validateItemRelationScheme(itemRelation)

        if (schemeValidation.sucess == true) {
            if (this.isItemExist(itemRelation.ItemExternalID)) {
                this.handlePrimaryItem(itemRelation);
                this.validateRelatedItems(itemRelation);
            }
            else {
                msgError = `failed with the following error: $itemRelation.ItemExternalID} ItemExternalID does not exist`;
            }
        }
        else {
            msgError = schemeValidation.error;
        }

        return {
            success: msgError == undefined,
            message: msgError,
            relationItem: itemRelation
        }
    }

    private validateRelatedItems(itemRelation: ItemRelations) {
        console.log("***itemRelation inside validateRelatedItems: ", itemRelation);
        // handeling restriction on related items list
        if (itemRelation.RelatedItems != undefined) {
            itemRelation.RelatedItems.forEach((item, index) => {
                ////Check if the item try to reference itself
                if (item === itemRelation.ItemExternalID) { itemRelation.RelatedItems!.splice(index, 1); }
                // if the user does not have the item, delete it from the list
                if (!this.isItemExist(item)) {
                    itemRelation.RelatedItems!.splice(index, 1);
                }
            });

            // no more than 25(maxNumOfRelatedItems) related items
            if (itemRelation.RelatedItems.length > this.maxNumOfRelatedItems) {
                itemRelation.RelatedItems = itemRelation.RelatedItems.slice(0, this.maxNumOfRelatedItems);
            }
        }
        return itemRelation;
    }

    private validateItemRelationScheme(itemRelation: ItemRelations) {
        // Define the required properties
        const requiredProperties = ['CollectionName', 'ItemExternalID', 'RelatedItems'];

        // Check if all required properties are present in the object
        const missingProperties = requiredProperties.filter(prop => !(prop in itemRelation));

        if (missingProperties.length > 0) {
            console.log('Validation failed. Missing properties:', missingProperties);
            return {sucess: false,
                    error: `Validation failed. Missing properties: ${missingProperties}`};
        }
        return {sucess: true};
    }

    // MARK: items functions

        // call items api, and set in a map if item is exist or not
        private async loadItems() {
            //array to save all items in the list in order to search if they exist
            const allItems = this.getItemsArray();
            console.log("number of items in the recived csv: ", allItems.length);
            // to ensure that duplicated items will be removed.
            this.initItemsMap(allItems);
            // a map to save all the items in the dimx object that existing in the user stock
            return await this.validateItemsAvailablitiy();
        }

        // creates an array of all the items that arrived in itemsRelations
        private getItemsArray(): string[] {
            const items: string[] = [];
            // add the primary item
            const itemExternalIDs: string[] = this.itemsRelations.map(obj => obj.ItemExternalID!);
            const relatedItems: string[] = this.itemsRelations.flatMap(obj => obj.RelatedItems!);
            items.push(...itemExternalIDs, ...relatedItems);

            return items;
        }

        private initItemsMap(allItems: string[]) {
            allItems.map(item => {
                this.existingItemsMap.set(item, false);
            });
            console.log("number of distinct items : ", this.existingItemsMap.size);
        }

        private async validateItemsAvailablitiy() {
            // convert items map into array in order to split to chunk and search
            const allItemsExternalIDs = Array.from(this.existingItemsMap.keys());
            const itemsService = new ItemsService(this.papiClient);
            const itemsMap = await itemsService.getItemsByExternalID(allItemsExternalIDs, ['ExternalID'], 'ExternalID');

            // set the value of the map to true if the item exist
            itemsMap.forEach((value, key) => {
                this.existingItemsMap.set(key, true);
            });
        }

        private isItemExist(item) {
            return this.existingItemsMap.get(item) === true
        }


    // MARK: Collections handling

    private async loadColllections() {
        const collections = this.getDistinctCollections();
        await this.createCollection(collections);
    }

    // // creates an array of all the collections that arrived
    private getDistinctCollections(): string[] {
        const collectionsMap: Map<string, boolean> = new Map<string, boolean>();
        // we pass them into a map in order to return only distinct collections
        this.itemsRelations.map(obj => {
            const collectionName = obj.CollectionName
            if (collectionName != undefined) {
                collectionsMap.set(collectionName, true);
            }
        });
        const collectionsArray = Array.from(collectionsMap.keys());
        return collectionsArray;
    }

    private async createCollection(collections: string []) {
        collections.map(async collection => {
            const newCollection: Collection = {
                Name: collection,
                Description: "",
                Hidden: false
            }
            await this.relatedItemsService.upsertRelatedCollection(newCollection);
        });
        Promise.all(collections);
    }

    // MARK: Helpers functions

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
