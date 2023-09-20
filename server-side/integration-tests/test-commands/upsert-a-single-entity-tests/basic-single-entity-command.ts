import { Client } from "@pepperi-addons/debug-server/dist"
import { ImportBaseCommand } from "../import-tests/import-base-command";

export class BasicSingleEntityCommand extends ImportBaseCommand {

    constructor(client: Client){
        super(client, 'Basic Upsert A Single Entity Test')
        this.numberOfEntities = 1;
    }

    async testAction() {
        return await this.resourceService.upsertSingleEntity(this.mockItemRelationsData[0]);
     }

    async processTestAction(testActionRes) {
        return testActionRes;
    }

    async test(res: any, data: any, expect: Chai.ExpectStatic): Promise<any> {
        const entities = await this.resourceService.getItemsRelations({
            where: `CollectionName="${this.collectionName}"`});
        expect(data.CollectionName).to.equal(entities[0].CollectionName);
        expect(data.ItemExternalID).to.equal(entities[0].ItemExternalID);
        expect(data.RelatedItems).to.include.members(entities[0].RelatedItems);
    }

    async cleanup(): Promise<any> {
        // delete the collection
        return await this.resourceService.deleteCollections([{"Name": this.collectionName}]);
     }
}
