import { Client } from "@pepperi-addons/debug-server/dist";
import { BaseCommand } from "../related-items-base-command";
import { ItemRelations, Collection } from "../../../../shared/entities";
import { DataImportInput } from "@pepperi-addons/papi-sdk";

export class ImportDataCommand extends BaseCommand {

    numberOfEntities;
    
    constructor(client: Client){
        super(client)
    }

    //create ItemRelations Array with items to import
    //number of items to import decided by numberOfEntities
    async initData() {
        var relations: ItemRelations[] = [];
        for ( var index = 0; index < this.numberOfEntities; index++) {
            var relation : ItemRelations = {
                "CollectionName": this.title,
                "ItemExternalID": this.items[index].ExternalID,
                "RelatedItems": [this.items[index + 1].ExternalID, this.items[index + 2].ExternalID, this.items[index + 3].ExternalID]
            }
            relations.push(relation);
        }
        return relations;
    }

    async testAction() {
        const dimxObj: DataImportInput = {
            "Objects": this.data
        }
        return this.papiClient.resources.resource("related_items").import.data(dimxObj);
     }

     async cleanup(): Promise<any> {
        this.data.map(obj => obj.Hidden = true);

        const dimxObj: DataImportInput = {
            "Objects": this.data
        }
        // delete items inside the collection
        await this.papiClient.resources.resource("related_items").import.data(dimxObj);
        // delete the collection
        return this.papiClient.post(`/addons/api/${this.addonUUID}/api/delete_collections`, [{"Name": this.title}]);
     }
}