import { Client } from "@pepperi-addons/debug-server/dist";
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

     // get items from adal and save them in map with key = itemExternalID
    async processTestAction(testActionRes) {
        const entities = await this.resourceService.getItemsRelations({where: `CollectionName="${this.collectionName}"`, page_size: -1});
        console.log(`entities: ${JSON.stringify(entities)}`);
        const itemsMap = new Map();
        entities.forEach((item: ItemRelations) => {
            itemsMap.set(item.ItemExternalID, item);
        }
        );
        console.log(`itemsMap: ${JSON.stringify(itemsMap)}`);
        return itemsMap;
    }

    async test(res: any, data: any, expect: Chai.ExpectStatic): Promise<any> {
        console.log(`data: ${JSON.stringify(data)}`);
        for (const itemRelation of this.mockItemRelationsData) {
            const item = data.get(itemRelation.ItemExternalID);
            console.log(`item: ${JSON.stringify(item)}, itemRelation: ${JSON.stringify(itemRelation.ItemExternalID)}`);
            expect(item).to.not.be.undefined;
            expect(item.RelatedItems).to.deep.equal(itemRelation.RelatedItems);
        }
    }

}
