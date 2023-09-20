import { Client } from "@pepperi-addons/debug-server/dist";
import { CPISchemeCommand } from "./cpi-scheme-command";
import { DataImportInput } from "@pepperi-addons/papi-sdk";

export class CPSchemeDeleteItemsCommand extends CPISchemeCommand {

    constructor(client: Client){
        super(client)
        this.numberOfEntities = 5;
        this.timeToWait = 3000;
        this.title = 'CPI_Scheme_Delete_Items_Command';
    }

    async testAction() {
        // import items
        const dimxObj: DataImportInput = {
            "Objects": this.mockItemRelationsData
        }
        await this.resourceService.importData(dimxObj);
        // delete collection with items in order to test that this collection deleted from the cpi-scheme
        return await this.resourceService.deleteItems(this.mockItemRelationsData);
    }

    async processTestAction(testActionRes) {
        return testActionRes;
    }

    async test(res, data, expect) {
        this.resourceService.sleep(this.timeToWait);
        const ans = this.mockItemRelationsData.map(async (item) => {
            // get the corresponding item from the cpi_meta_data type scheme
            const cpiItem = await this.resourceService.getCPIItemsRelations(item);
            expect(cpiItem).to.equal([]);
        })
        await Promise.all(ans).catch(err => console.log(err));
    }
}
