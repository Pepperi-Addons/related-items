import { Client } from "@pepperi-addons/debug-server/dist"
import { ImportDataBaseCommand } from "./import-data-command"

export class BigDataCommand extends ImportDataBaseCommand {
    constructor(client: Client){
        super(client)
        this.title = 'Big Size Data Test'
        this.numberOfEntities = 500;

    }

    async processTestAction(testActionRes) {
        this.dataToTest = 0;
        testActionRes.map(res => {
            if (res.Status == "Insert") {
                this.dataToTest++;
            }
        });
        return this.dataToTest;
    }

    async test(res: any, data: any, expect: Chai.ExpectStatic): Promise<any> {
        expect(data).to.equal(this.numberOfEntities);
    }
}