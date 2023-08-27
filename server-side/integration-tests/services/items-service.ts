import { v4 as uuid } from 'uuid';
import { ItemRelations, itemsResourceObject } from 'shared';
import { PapiClient } from '@pepperi-addons/papi-sdk/dist/papi-client';
import split from 'just-split';

export class ItemsService {
    numberOfItems;

    constructor(private papiClient: PapiClient) {
    }

    async prepareUserItems(numberOfItems: number): Promise<ItemRelations[]> {
        this.numberOfItems = numberOfItems;
        let items: ItemRelations[] = await this.getUsersItems();
        const itemsCount = await this.getItemsCount();
        // generating items if there are not enough items for the tests
        if (itemsCount < this.numberOfItems) {
            await this.createNewItems(items.length);
            // get list with the new items
            items = await this.getUsersItems();
        }
        return items;
    }

    // resource search return 1000 items per page, we need list of 4000 items for huge test so we need to get 4 pages
    async getUsersItems(): Promise<ItemRelations[]> {
        let items: ItemRelations[] = [];
        // for huge test we need the stock to be with 100000 items but the file only contain 4K enteries
        // for small test we need 500 entieries
        const itemsToAddCounter: number = this.numberOfItems === 100000 ? 4003 : this.numberOfItems;
        while (items.length < itemsToAddCounter) {
            const searchRes = await this.papiClient.resources.resource("items").search({
                Fields: ['ExternalID'],
                PageSize: 1000,
                Page: items.length / 1000 + 1
            });
            items = items.concat(searchRes.Objects);
        }
        return items;
    }

    async getItemsCount(): Promise<number> {
        return (await this.papiClient.resources.resource("items").search({
            PageSize: 1,
            IncludeCount: true
        })).Count as number;
    }


    async createNewItems(itemsCounter: number) {
        const itemsToAdd: itemsResourceObject[] = [];
        while (itemsCounter <= this.numberOfItems) {
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

