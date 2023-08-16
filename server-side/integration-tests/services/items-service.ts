import { v4 as uuid } from 'uuid';
import { ItemRelations, itemsResourceObject } from 'shared';
import { PapiClient } from '@pepperi-addons/papi-sdk/dist/papi-client';

export class ItemsService {

    // number of items the user needs for the tests
    // 500 items for big data entities, 3 items for the related items of the last entity  because we add next 3 items
    NUMBER_OF_ITEMS = 503;

    constructor(private papiClient: PapiClient) {
    }

    // gets distributers items and if there are not enough items generates new ones
    async prepareUserItems(): Promise<ItemRelations[]> {
        let items: ItemRelations[] = await this.getUsersItems()
        // generating items if there are not enough items for the tests
        if (items.length < this.NUMBER_OF_ITEMS) {
            await this.createNewItems(items.length);
            // get list with the new items
            items = await this.getUsersItems();
        }
        return items;
    }

    async getUsersItems(): Promise<ItemRelations[]> {
        return (await this.papiClient.resources.resource("items").search({
            Fields: ['ExternalID'],
            PageSize: this.NUMBER_OF_ITEMS,
        })).Objects as ItemRelations[];
    }


    async createNewItems(itemsCounter) {
        const itemsToAdd: itemsResourceObject[] = [];
        while (itemsCounter <= this.NUMBER_OF_ITEMS) {
            itemsToAdd.push({
                "ExternalID": `Test${itemsCounter}`,
                "MainCategoryID": 1,
                "Key": uuid()
            });
            itemsCounter++;
        }
        const dataImportInput = {
            "Objects": itemsToAdd
        }
        await this.papiClient.resources.resource("items").import.data(dataImportInput);
    }
}
