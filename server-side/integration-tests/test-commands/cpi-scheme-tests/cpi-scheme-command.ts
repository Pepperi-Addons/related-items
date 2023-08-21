import { Client } from "@pepperi-addons/debug-server/dist"
import { DataImportInput } from "@pepperi-addons/papi-sdk";
import { ImportBaseCommand } from "../import-tests/import-base-command";

export class CPISchemeCommand extends ImportBaseCommand {

    constructor(client: Client){
        super(client, 'CPI_Scheme_Command')
        this.numberOfEntities = 5;
        this.timeToWait = 3000;
    }

    timeToWait: number; // time to wait to PNS

    async testAction() {
        const dimxObj: DataImportInput = {
            "Objects": this.mockItemRelationsData
        }
        return await this.resourceService.importData(dimxObj);
     }

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
        const ans = data.map( async (item) => {
            //get all the related items uuids
            const dataRelatedItems = await this.resourceService.getItemsUUID(item.ADALItem.RelatedItems);
            const dataItems = dataRelatedItems.map(obj => obj.UUID);
            const cpiItems = item.CPIItem[0]?.RelatedItems ? item.CPIItem[0]?.RelatedItems : [];
            expect(dataItems).to.deep.equal(cpiItems);
        });
        await Promise.all(ans).catch(err => console.log(err));
        return ans;
    }
}
