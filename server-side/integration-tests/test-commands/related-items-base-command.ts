import { BaseTest } from '@pepperi-addons/addon-testing-framework'
import { Client } from '@pepperi-addons/debug-server/dist';
import { PapiClient } from '@pepperi-addons/papi-sdk';

export class BaseCommand extends BaseTest {
    title = 'Test Title'

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
        describe(this.title, () => {
            it('test', async () => {
                this.test("equel", 1, expect);
            })
        })
    }
    test(res: any, data: any, expect: Chai.ExpectStatic): Promise<any> {
        throw new Error("Method not implemented.");
    }
}