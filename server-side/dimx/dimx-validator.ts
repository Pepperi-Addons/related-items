import { Item } from '@pepperi-addons/cpi-node/build/cpi-side/app/entities';
import {SearchBody, SearchData } from '@pepperi-addons/papi-sdk'
import { PapiClient, AddonData} from '@pepperi-addons/papi-sdk'

export class DimxValidator {
    maximumNumberOfRelatedItems = 25;
    existingItemsMap: Map<string, Boolean> = new Map<string, Boolean>();

    constructor(private papiClient: PapiClient) {
    }
    
    // call items api, and set in a map if item is exist or not
    async createExistingItemsList(dimxObjects) {
     //array to save all items in the list in order to search if they exist 
        const allItems = this.createItemsArrayFromDimxObject(dimxObjects);
    // a map to save all the items in the dimx object that existing in the user stock
        return await this.createExistingItemsMap(allItems);
    }

    async handleDimxObjItem(dimxObj) {
        console.log("***dimxobj inside the start of handleDimx", dimxObj);
        console.log("***existing items map inside the start of handleDimx", this.existingItemsMap);
        let mainItem = dimxObj.Object;

        if(this.existingItemsMap.get(mainItem.ItemExternalID) == true) {
            dimxObj.Object.Hidden = false
            dimxObj.Object.Key = `${dimxObj.Object.CollectionName}_${dimxObj.Object.ItemExternalID}`;
        }
        // handeling restriction on related items list
        dimxObj.Object.RelatedItems.forEach(async (item, index) => {
            ////Check if the item try to reference itself
            if (item === mainItem.ItemExternalID) dimxObj.Object.RelatedItems.splice(index, 1);
            // if the user does not have the item, delete it from the list 
            if(this.existingItemsMap.get(item) != true) {
                dimxObj.Object.RelatedItems.splice(index, 1);
            }
        }); 
        console.log("***dimxobj inside the end of handleDimx", dimxObj);
        return dimxObj;
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

            return this.search('items',searchBody).then(items => {
                console.log("***items from search", items);
                 for (var item of items.Objects) {
                    this.existingItemsMap.set(item.ExternalID, true)
                }
            });
        })
        await Promise.all(requests);
    }

    createItemsArrayFromDimxObject(dimxObjects) {
        var items: any[] = [];
        for (var dimxObj of dimxObjects) {
            console.log("DIMXObj", dimxObj.Object) 
            // add the main item  
            items.push(dimxObj.Object.ItemExternalID);
            console.log("DIMXObj.Object.ExID", dimxObj.Object.ItemExternalID)
            // add all the related items
            dimxObj.Object.RelatedItems.forEach(async (item) => {
                console.log("DIMXObj.Object.RelatedItems", dimxObj.Object.RelatedItems)
                console.log("DIMXObj current obj", item)
                items.push(item);
            }
            );
        }
        return items;
    }

   // get list of all items and returns the existing items it Items resource
    async search(resourceName: string, params: SearchBody): Promise<SearchData<AddonData>> {
        return (await this.papiClient.resources.resource(resourceName).search(params));
    }

    // gets an array of items and max chuck size and splits the array of items to chunks according to the max chunk size
    splitToChunks<T>(items: T[],maxKeysInChunk: number): T[][]{
        const numberOfKeys = items.length; 
        const res: T[][] = []

        // get the number of chunks with no more than max keys in chunk
        const numberOfChunks = Math.ceil(numberOfKeys /maxKeysInChunk);

        // calculating equally the number of keys in every chunk
        const keysInChunk = Math.ceil(numberOfKeys/numberOfChunks)

        // splitting the array of keys to the desired chunks
        for (let i = 0; i < numberOfKeys; i+=keysInChunk) {
            res.push(items.slice(i, i + keysInChunk));
        }

        console.log(`sliceKeysToChunks from ${items.length} keys to ${res.length} chunks`)
        return res;
    }
}
