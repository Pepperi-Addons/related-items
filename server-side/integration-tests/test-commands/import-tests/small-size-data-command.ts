import { Client } from "@pepperi-addons/debug-server/dist"
import { ImportDataCommand } from "./import-data-command"

export class SmallDataCommand extends ImportDataCommand {
    constructor(client: Client){
        super(client)
        this.title = 'Small Size Data Test'
        this.numberOfEntities = 10;

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
        expect(data).to.equal(10);
    }
}