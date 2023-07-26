import { BaseTest } from '@pepperi-addons/addon-testing-framework'
import { Client } from '@pepperi-addons/debug-server/dist';
import { AddonData, PapiClient, SearchData } from '@pepperi-addons/papi-sdk';
import { ItemRelations, itemsResourceObject } from '../../../shared/entities';
import { v4 as uuid } from 'uuid';

export class BaseCommand extends BaseTest {
    title = 'Test Title'
    items;
    data;
    testActionRes;
    processRes;
    addonUUID;

    protected papiClient: PapiClient;
    
    constructor(protected client: Client) {
        super()
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
             actionUUID: client.ActionUUID,
        })
        this.addonUUID = client.AddonUUID;
    }
    
    tests(describe: (suiteTitle: string, func: () => void) => void, it: (name: string, fn: Mocha.Func) => void, expect: Chai.ExpectStatic): void {
        this.execute(describe, it, expect)
    }

    execute(describe: (suiteTitle: string, func: () => void) => void, it: (name: string, fn: Mocha.Func) => void, expect: Chai.ExpectStatic): void {
        describe(this.title, () => {
            it('prepareUserItems', async () => {
               this.items = await this.prepareUserItems();
            })
            it("initData", async () => {
               this.data = await this.initData(this.items);
            })
            it("testAction", async () => {
                this.testActionRes = await this.testAction(this.data);
            })
            it("processRes",async () => {
                this.processRes = await this.processTestAction(this.testActionRes);
            })
            it('Test and Cleanup', async () => {
                try {
                await this.test(this.testActionRes, this.processRes, expect)
                } finally {
                    await this.cleanup()
                    
                }
            })
        })
    }

    async test(res: any, data: any, expect: Chai.ExpectStatic): Promise<any> {
        throw new Error("Method not implemented.");
    }

    async getUsersItems(): Promise<ItemRelations[]> {
        return (await this.papiClient.resources.resource("items").search({
            Fields: ['ExternalID'],
            PageSize: 500,
        })).Objects as ItemRelations[];
    }

    async prepareUserItems(): Promise<ItemRelations[]> {
        var items: ItemRelations[] = await this.getUsersItems()
        // Creating items if there are not enough items for tests
        if (items.length < 500) {
            this.createNewItems(items.length);
            // get list with the new items
            items = await this.getUsersItems();
        }
        return items;
    }

    createNewItems(itemsCounter) {
        var itemsToAdd: itemsResourceObject[] = [];
        var i = 0;
        while (itemsCounter.length < 1000) {
            itemsToAdd.push({
                "ExternalID": `Test${i}`,
                "MainCategoryID": 1,
                "Key": uuid()
            });
            i++;
        }
        const dataImportInput = {
            "Objects" : itemsToAdd
        }
        this.papiClient.resources.resource("items").import.data(dataImportInput);
    }

    initData(items: ItemRelations[]) {
        throw new Error("Method not implemented.");
    }

    testAction(data) {
        throw new Error("Method not implemented.");
    }

    processTestAction(testActionRes) {
        throw new Error("Method not implemented.");
    }
    // clean up the data that was pushed to ADAL
    cleanup(): Promise<any> {
        // do nothing
        return Promise.resolve()
    }
}