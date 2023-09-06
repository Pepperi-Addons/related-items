import { v4 as uuid } from 'uuid';
import { ItemRelations, itemsResourceObject } from 'shared';
import { PapiClient } from '@pepperi-addons/papi-sdk/dist/papi-client';
import split from 'just-split';

export class ItemsService {
    numberOfItemsToCreate;

    constructor(private papiClient: PapiClient) {
    }

    async prepareUserItems(numberOfItemsToCreate: number): Promise<ItemRelations[]> {
        this.numberOfItemsToCreate = numberOfItemsToCreate;
        let items: ItemRelations[] = await this.getUsersItems(['ExternalID']);
        // generating items if there are not enough items for the tests
        if (items.length < this.numberOfItemsToCreate) {
            await this.createItemsUntilStockReached(items.length);
            // get list with the new items
            items = await this.getUsersItems(['ExternalID']);
        }
        return items;
    }

    async getUsersItems(fields: string[]): Promise<ItemRelations[]> {
        return await this.papiClient.items.find({ fields: fields, page_size: -1 });
    }
   
    // Get as parameter the current count of existing items and generate new items until the desired stock level,
    // specified by numberOfItemsToCreate, is reached.
    async createItemsUntilStockReached(itemsCounter: number) {
        const itemsToAdd: itemsResourceObject[] = [];
        while (itemsCounter <= this.numberOfItemsToCreate) {
            itemsToAdd.push({
                "ExternalID": `Test${itemsCounter}`,
                "MainCategoryID": 1,
                "Key": uuid()
            });
            itemsCounter++;
        }
        await this.importItems(itemsToAdd);
    }

     // divide the items to chunks of 500 items and import every chunk separately
    async importItems(items: ItemRelations[]) {
        const chunks = split(items, 500);
        const arr = chunks.map(async (chunk) => {
            const dataImportInput = {
                "Objects": chunk
            }
            return await this.papiClient.resources.resource("items").import.data(dataImportInput);
        });
        return Promise.all(arr);
    }
    }

