import { Client } from "@pepperi-addons/debug-server/dist"
import { ImportDataCommand } from "./import-data-command"

export class BigDataCommand extends ImportDataCommand {
    constructor(client: Client){
        super(client)
        this.title = 'Big Size Data Test'
        this.numberOfEntities = 500;

    }

    async processTestAction(testActionRes) {
        this.processRes = 0;
        testActionRes.map(res => {
            if (res.Status == "Insert" || res.Status == "Update") {
                this.processRes++;
            }
        });
        return this.processRes;
    }

    async test(res: any, data: any, expect: Chai.ExpectStatic): Promise<any> {
        expect(data).to.equal(500);
    }
}