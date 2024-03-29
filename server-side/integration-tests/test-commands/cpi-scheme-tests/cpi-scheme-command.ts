import { Client } from "@pepperi-addons/debug-server/dist"
import { DataImportInput } from "@pepperi-addons/papi-sdk";
import { ImportBaseCommand } from "../import-tests/import-base-command";
import { CPISideHanler } from "../../../cpi-side-handler/CPISideHandler";

export class CPISchemeCommand extends ImportBaseCommand {

    constructor(client: Client, title?: string) {
        const testTitle = title ? title : 'CPI_Scheme_Command';
        super(client, testTitle)
        this.numberOfEntities = 5;
        this.timeToWait = 20000; // due to we can't update cpi_meta_data type items in a batch
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
        console.log("processTestAction cpi item: ", JSON.stringify(cpiItems));
        const items = await new CPISideHanler(this.papiClient).getItemsMap(this.mockItemRelationsData);
        const res = this.mockItemRelationsData.map((item) => {
            const itemUUID = items.get(item.ItemExternalID!).Key;
            // get the corresponding item from the cpi_meta_data type scheme
            const cpiItem = cpiItems.find(obj => {
                return obj.Key === `${item.CollectionName}_${itemUUID}`
            });
            return { CPIItem: cpiItem, ADALItem: item }
        });
        return res;
    }

    async test(res, data, expect) {
        // every entity in data contains itemRelation and it corresponding cpi-item(represent with UUID) and we check that its related items identical
        const ans = data.map(async (item) => {
            //get all the related items uuids
            const dataRelatedItems = await this.resourceService.getItemsUUID(item.ADALItem.RelatedItems);
            const dataItems = dataRelatedItems.map(obj => obj.UUID);
            const cpiItems = item.CPIItem?.RelatedItems ? item.CPIItem?.RelatedItems : [];
            if (dataItems.toString() !== cpiItems.toString()){
                console.log(`item: ${JSON.stringify(item)}, dataItems: ${JSON.stringify(dataItems)}, cpiItems: ${JSON.stringify(cpiItems)}, time: ${Date.now()}`);
            }
            expect(dataItems).to.deep.equal(cpiItems);
        });
        await Promise.all(ans);
    }
}
