import { BaseCommand } from "./related-items-base-command";

export class TestCommand extends BaseCommand{
    async test(syncRes: any,syncData: any,expect: Chai.ExpectStatic): Promise<any> {
       expect(1).to.equal(1);
    }
}