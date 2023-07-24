import { BaseCommand } from "./related-items-base-command";

export class TestCommand extends BaseCommand{
    async test(syncRes: any,syncData: any,expect: Chai.ExpectStatic): Promise<any> {
        return syncData == expect;
    }
}