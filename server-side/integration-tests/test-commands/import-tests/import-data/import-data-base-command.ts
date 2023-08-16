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
        const entities = await this.resourceService.getItemsRelations({where: `CollectionName="${this.collectionName}"`});
        const itemsMap = new Map();
        entities.forEach((item: ItemRelations) => {
            itemsMap.set(item.ItemExternalID, item);
        }
        );
        return itemsMap;
    }

    async test(res: any, data: any, expect: Chai.ExpectStatic): Promise<any> {
        this.mockItemRelationsData.forEach((itemRelation: ItemRelations) => {
            const item = data.get(itemRelation.ItemExternalID);
            expect(item.RelatedItems.to.deep.equal(itemRelation.RelatedItems));
        });
    }

}
