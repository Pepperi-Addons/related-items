import { Client } from "@pepperi-addons/debug-server/dist";
import { BaseCommand } from "../related-items-base-command";
import { ItemRelations } from "shared";
import { v4 as uuid } from 'uuid';
import { ResourceService } from "../../services/resource-service";
import { PapiClient } from "@pepperi-addons/papi-sdk";

// base class for all import tests
export class ImportBaseCommand extends BaseCommand {

    resourceService: ResourceService;
    numberOfEntities = 0; // number of entities to import
    collectionName: string;

    constructor(protected client: Client, title: string) {
        super(client)
        
        const dimxPapiClient = new PapiClient({
            baseURL: this.client.BaseURL,
            token: this.client.OAuthAccessToken,
            addonUUID: this.client.AddonUUID,
            addonSecretKey: this.client.AddonSecretKey,
            // removed action uuid because when running tests async and calling async dimx the test will end on dimx commands
            // actionUUID: client.ActionUUID,
        })

         this.resourceService = new ResourceService(dimxPapiClient, client);
         this.title = title;
         this.collectionName = `${this.title }_${ uuid()}`;
    }

    //create ItemRelations Array with items to import
    //number of items to import decided by numberOfEntities
    async initData(): Promise<ItemRelations[]> {
        const relations: ItemRelations[] = [];
        for ( let index = 0; index < this.numberOfEntities; index++) {
            const relation : ItemRelations = {
                "CollectionName": this.collectionName,
                "ItemExternalID": this.items[index].ExternalID,
                "RelatedItems": [this.items[index + 1].ExternalID, this.items[index + 2].ExternalID, this.items[index + 3].ExternalID]
            }
            relations.push(relation);
        }
        return relations;
    }

     async cleanup(): Promise<any> {
        await this.resourceService.deleteItems(this.mockItemRelationsData);
        // delete the collection
        return await this.resourceService.deleteCollections([{"Name": this.collectionName}]);
     }
}
