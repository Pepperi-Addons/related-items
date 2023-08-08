import { Client } from "@pepperi-addons/debug-server/dist"
import { ImportDataBaseCommand } from "../import-tests/import-data/import-data-base-command";

export class CPISchemeCommand extends ImportDataBaseCommand {

    constructor(client: Client){
        super(client, 'CPI_Scheme_Command')
        this.numberOfEntities = 5;
        this.timeToWait = 3000;
    }

    timeToWait: number; // time to wait to PNS

    async processTestAction(testActionRes) {
        // waiting for PNS
        await this.resourceService.sleep(this.timeToWait);
        const res = this.mockItemRelationsData.map(async (item) => {
            // get the corresponding item from the cpi_meta_data type scheme
            const cpiItem = await this.resourceService.getCPIItemsRelations(item);
            return {CPIItem: cpiItem, ADALItem: item}
        });
        return await Promise.all(res);
    }

    async test(res, data, expect) {
        // every entity in data contains itemRelation and it corresponding cpi-item(represent with UUID) and we check that its related items identical
        data.map( async item => {
            const dataRelatedItems = await this.resourceService.getItemsFilteredByUUID(item.ADALItem.RelatedItems);
            const dataItems = dataRelatedItems.map(obj => obj.UUID);
            const cpiItems = item.CPIItem[0]?.RelatedItems ? item.CPIItem[0]?.RelatedItems : [];
            expect(dataItems).to.deep.equal(cpiItems);
        }
        );
    }
    async cleanup(): Promise<any> {
        // delete the collection
        return await this.resourceService.deleteCollections([{"Name": this.collectionName}]);
     }
}