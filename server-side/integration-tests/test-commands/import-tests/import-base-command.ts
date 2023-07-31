import { Client } from "@pepperi-addons/debug-server/dist";
import { DataImportInput } from "@pepperi-addons/papi-sdk";
import { v4 as uuid } from 'uuid';
import { ResourceService } from "../../services/resource-service";
import { ItemRelations } from "../../../../shared/entities";
import { BaseCommand } from "../related-items-base-command";

// base class for all import tests
export class ImportBaseCommand extends BaseCommand {

    resourceService: ResourceService;
    numberOfEntities: number = 0; // number of entities to import
    collectionName: string;

    constructor(protected client: Client, title: string) {
        super(client)
         this.resourceService = new ResourceService(this.papiClient, client);
         this.title = title;
         this.collectionName = this.title + "_" + uuid();
    }
    
    //create ItemRelations Array with items to import
    //number of items to import decided by numberOfEntities
    async initData(): Promise<ItemRelations[]> {

        var relations: ItemRelations[] = [];
        for ( var index = 0; index < this.numberOfEntities; index++) {
            var relation : ItemRelations = {
                "CollectionName": this.collectionName,
                "ItemExternalID": this.items[index].ExternalID,
                "RelatedItems": [this.items[index + 1].ExternalID, this.items[index + 2].ExternalID, this.items[index + 3].ExternalID]
            }
            relations.push(relation);
        }
        return relations;
    }

     async cleanup(): Promise<any> {
        // delete the collection
        return await this.resourceService.deleteCollections([{"Name": this.collectionName}]);
     }
}