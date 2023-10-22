import { Client } from "@pepperi-addons/debug-server/dist"
import { DataImportInput } from "@pepperi-addons/papi-sdk";
import { ImportBaseCommand } from "../import-tests/import-base-command";
import { CPISideHanler } from "../../../cpi-side-handler/CPISideHandler";

export class CPISchemeCommand extends ImportBaseCommand {

    constructor(client: Client){
        super(client, 'CPI_Scheme_Command')
        this.numberOfEntities = 5;
        this.timeToWait = 10000;
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
        //get all the cpi items
        const cpiItems = await this.resourceService.getCPIItemsRelations(this.collectionName);
        const items = await new CPISideHanler(this.papiClient).getItemsMap(this.mockItemRelationsData);
        const res = this.mockItemRelationsData.map((item) => {
            const itemUUID = items.get(item.ItemExternalID!).Key;
            // get the corresponding item from the cpi_meta_data type scheme
            const cpiItem = cpiItems.find(obj => {
                return obj.Key === `${item.CollectionName}_${itemUUID}`
            });
            return {CPIItem: cpiItem, ADALItem: item}
        });
        return res;
    }

     async test(res, data, expect) {
        let i = 0;
        // every entity in data contains itemRelation and it corresponding cpi-item(represent with UUID) and we check that its related items identical
        const ans = data.map( async (item) => {
            //get all the related items uuids
            const dataRelatedItems = await this.resourceService.getItemsUUID(item.ADALItem.RelatedItems);
            const dataItems = dataRelatedItems.map(obj => obj.UUID);
            const cpiItems = item.CPIItem?.RelatedItems ? item.CPIItem?.RelatedItems : [];
            // count the number of items that not equal - should be 0 for success
            // the following check is just for debug
            if (dataItems !== cpiItems) {
                i++
                console.log(`not equal CPI items: ${ cpiItems}`);
                console.log(`not equal ADAL items: ${ dataItems}`);
                console.log(`not equal i: ${ i}`);
            }
            expect(dataItems).to.deep.equal(cpiItems);
        });
        await Promise.all(ans);
    }
}
