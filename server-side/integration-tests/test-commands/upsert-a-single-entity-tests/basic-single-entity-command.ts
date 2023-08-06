import { Client } from "@pepperi-addons/debug-server/dist"
import { BaseCommand } from "../related-items-base-command"
import { ItemRelations } from "../../../../shared/entities"
import { v4 as uuid } from 'uuid';
import { ResourceService } from "../../services/resource-service";

export class BasicSingleEntityCommand extends BaseCommand {

    title = 'Basic Upsert A Single Entity Test';
    resourceService: ResourceService;
    collectionName: string;

    constructor(client: Client){
        super(client)
        this.resourceService = new ResourceService(this.papiClient, client);
        this.collectionName = this.title + uuid();
    }

    initData(): Promise<ItemRelations[]> {
        const itemToUpsert: ItemRelations = {
            "CollectionName": this.collectionName,
            ItemExternalID: this.items[0].ExternalID,
            RelatedItems: [this.items[1].ExternalID!, this.items[2].ExternalID!, this.items[3].ExternalID!]
        }
        return Promise.resolve([itemToUpsert]);
    }

    async testAction() {
        return await this.resourceService.upsertSingleEntity(this.mockItemRelationsData[0]);
     }

    async processTestAction(testActionRes) {
        return testActionRes;
    }

    async test(res: any, data: any, expect: Chai.ExpectStatic): Promise<any> {
        const entities = await this.resourceService.getItemsRelations({
            where: `CollectionName=${this.collectionName}`});
        expect(data.CollectionName).to.equal(entities[0].CollectionName);
        expect(data.ItemExternalID).to.equal(entities[0].ItemExternalID);
        expect(data.RelatedItems).to.include.members(entities[0].RelatedItems);
    }

    async cleanup(): Promise<any> {
        // delete the collection
        return await this.resourceService.deleteCollections([{"Name": this.collectionName}]);
     }
}