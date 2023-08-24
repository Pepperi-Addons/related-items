import { BaseTest } from '@pepperi-addons/addon-testing-framework'
import { Client } from '@pepperi-addons/debug-server/dist';
import { PapiClient } from '@pepperi-addons/papi-sdk';
import { ItemRelations } from 'shared';
import { ItemsService } from '../services/items-service';


export class BaseCommand extends BaseTest {
    title = 'Test Title'
    items; // distribut items
    mockItemRelationsData: ItemRelations[] = [];
    testActionResult; //the answer from the test function
    dataToTest; // data for the test


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
    }

    tests(describe: (suiteTitle: string, func: () => void) => void, it: (name: string, fn: Mocha.Func) => void, expect: Chai.ExpectStatic): void {
        this.execute(describe, it, expect)
    }

    execute(describe: (suiteTitle: string, func: () => void) => void, it: (name: string, fn: Mocha.Func) => void, expect: Chai.ExpectStatic): void {
        const itemsService = new ItemsService(this.papiClient);

        describe(this.title, () => {
            it('prepareUserItems', async () => {
            // 500 items for big data entities, 3 items for the related items of the last entity  because we add next 3 items
               this.items = await itemsService.prepareUserItems(503);
            })
            it("initData", async () => {
               this.mockItemRelationsData = await this.initData(this.items);
            })
            it("testAction", async () => {
                this.testActionResult = await this.testAction(this.mockItemRelationsData);
            })
            it("processRes", async () => {
                this.dataToTest = await this.processTestAction(this.testActionResult);
            })
            it('Test and Cleanup', async () => {
                try {
                await this.test(this.testActionResult, this.dataToTest, expect)
                }
                catch (err) {
                    console.log(err);
                }
                finally {
                    await this.cleanup()
                }
            })
        })
    }

    async test(res: any, data: any, expect: Chai.ExpectStatic): Promise<any> {
        throw new Error("Method not implemented.");
    }

    initData(items: ItemRelations[]): Promise<ItemRelations[]> {
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
