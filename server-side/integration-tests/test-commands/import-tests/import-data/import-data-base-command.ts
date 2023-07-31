import { Client } from "@pepperi-addons/debug-server/dist";
import { BaseCommand } from "../../related-items-base-command";
import { ItemRelations } from "../../../../../shared/entities";
import { DataImportInput } from "@pepperi-addons/papi-sdk";
import { ImportBaseCommand } from "../import-base-command";

// base class for import data tests
export class ImportDataBaseCommand extends ImportBaseCommand {

    constructor(protected client: Client, title: string) {
        super(client, title)
    }

    async testAction() {
        const dimxObj: DataImportInput = {
            "Objects": this.mockItemRelationsData
        }
        return await this.resourceService.importData(dimxObj);
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