import { Client, Request } from '@pepperi-addons/addon-testing-framework/dist/index';
import * as Commands from '../server-side/integration-tests/index';
import { BaseTest, TestRunner } from '@pepperi-addons/addon-testing-framework';

export async function tests(client: Client, request: Request): Promise<any>{

    if (request.method === 'GET') {
        return Object.keys(Commands).map((key) => {
            return {
                Name: key,
            };
        });
    }

    if (request.method === 'POST') {
        const testName = request.body.Name;
        if (!testName) {
            throw new Error('Missing body parameter: Name');
        }
        if (typeof testName !== 'string') {
            throw new Error('Body parameter: Name must be a string');
        }
        const Test: new (client) => BaseTest = Commands[testName];
        if (!Test) {
            throw new Error(`Test ${testName} not found`);
        }
        return new TestRunner(client, request).run(new Test(client));
    }


}