import { Client } from "@pepperi-addons/debug-server/dist";
import { CPISchemeCommand } from "./cpi-scheme-command";
import { DataImportInput } from "@pepperi-addons/papi-sdk";

export class CPSchemeDeleteItemsCommand extends CPISchemeCommand {

    constructor(client: Client){
        super(client, 'CPI_Scheme_Delete_Items_Command')
        this.numberOfEntities = 5;
        this.timeToWait = 5000;
    }

    async testAction() {
        // import items
        const dimxObj: DataImportInput = {
            "Objects": this.mockItemRelationsData
        }
        await this.resourceService.importData(dimxObj);
        await this.resourceService.sleep(this.timeToWait);
        // delete collection with items in order to test that this collection deleted from the cpi-scheme
        return await this.resourceService.deleteItems(this.mockItemRelationsData);
    }

    async processTestAction(testActionRes) {
        return testActionRes;
    }

    async test(res, data, expect) {
        await this.resourceService.sleep(this.timeToWait);
        const cpiItems = await this.resourceService.getCPIItemsRelations(this.collectionName);
        expect(cpiItems.length).to.equal(0);
    }

    async cleanup(): Promise<any> {
        // do nothing
        return Promise.resolve();
    }
}
