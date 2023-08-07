import { Client } from "@pepperi-addons/debug-server/dist";
import { BaseCommand } from "../related-items-base-command";
import { ItemRelations } from "shared";
import { DataImportInput } from "@pepperi-addons/papi-sdk";
import { ResourceService } from "../../services/resource-service";
import { v4 as uuid } from 'uuid';

// base class for import data tests
export class ImportDataBaseCommand extends BaseCommand {

    resource: ResourceService;
    numberOfEntities: number = 0; // number of entities to import
    collectionName: string;

    constructor(protected client: Client) {
        super(client)
         this.resource = new ResourceService(this.papiClient, client);
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

    async testAction() {
        const dimxObj: DataImportInput = {
            "Objects": this.mockItemRelationsData
        }
        return await this.resource.importData(dimxObj);
     }

     async cleanup(): Promise<any> {
        this.mockItemRelationsData.map(obj => obj.Hidden = true);
        const dimxObj: DataImportInput = {
            "Objects": this.mockItemRelationsData
        }
        // delete items inside the collection
        await this.resource.importData(dimxObj);
        // delete the collection
        return await this.resource.deleteCollections([{"Name": this.collectionName}]);
     }
}