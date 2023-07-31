import { Client } from "@pepperi-addons/debug-server/dist"
import { BaseCommand } from "../related-items-base-command"
import { ItemRelations } from "../../../../shared/entities"
import { v4 as uuid } from 'uuid';
import { ResourceService } from "../../services/resource-service";

export class NotExistingItemSingleEntityCommand extends BaseCommand {

    title = 'Not_Existing_Item_Single_Entity_Command';
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
            ItemExternalID: "externalId", //not existing externalid
            RelatedItems: [this.items[1].ExternalID!, this.items[2].ExternalID!, this.items[3].ExternalID!]
        }
        return Promise.resolve([itemToUpsert]);
    }

    async testAction() {
        return await this.resourceService.upsertSingleEntity(this.mockItemRelationsData[0]);
     }

    async processTestAction(testActionRes) {
        debugger
        return testActionRes;
    }

    async test(res: any, data: any, expect: Chai.ExpectStatic): Promise<any> {
        expect(data).to.equal('3 items were added');
    }

    async cleanup(): Promise<any> {
        // delete the collection
        return await this.resourceService.deleteCollections([{"Name": this.collectionName}]);
     }
}