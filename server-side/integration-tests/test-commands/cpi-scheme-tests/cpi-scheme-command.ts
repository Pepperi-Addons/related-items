import { Client } from "@pepperi-addons/debug-server/dist"
import { ImportDataBaseCommand } from "../import-tests/import-data/import-data-base-command";
import { FindOptions } from "@pepperi-addons/papi-sdk";

export class CPISchemeCommand extends ImportDataBaseCommand {

    constructor(client: Client){
        super(client, 'CPI_Scheme_Command')
        this.numberOfEntities = 100;

    }

    async processTestAction(testActionRes) {
        return testActionRes;
    }

    async test(res, data, expect) {
        debugger;
        data.map(async (item) => {
            const findOptions: FindOptions = {
                where: `Key='${item.Key}'`
            }
            const cpiItem = await this.resourceService.getCPIItemsRelations(findOptions) as any;
            const dataItem = await this.resourceService.getItemsRelations(findOptions) as any;
            expect(cpiItem.RelatedItems).to.include.members(dataItem.RelatedItems);
        });
    }
    async cleanup(): Promise<any> {
        // delete the collection
        return await this.resourceService.deleteCollections([{"Name": this.collectionName}]);
     }
}