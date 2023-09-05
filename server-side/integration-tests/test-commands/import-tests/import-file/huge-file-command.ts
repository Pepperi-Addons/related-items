import { Client } from "@pepperi-addons/debug-server/dist"
import { ImportFileBaseCommand } from "./import-file-base-command";
import { ItemsService } from "../../../services/items-service";

// test for user with a huge items stock(100k items in stock)
// import file with huge number of entities(4k entities)
export class HugeFileCommand extends ImportFileBaseCommand {

    constructor(client: Client){
        super(client, 'Huge_Size_File_Test')
        this.numberOfEntities = 4000;
    }

    // for huge file test we need to create 100k items
    async initData() {
        const itemsService = new ItemsService(this.papiClient);
        this.items = await itemsService.prepareUserItems(100000, this.numberOfEntities);
        return await super.initData();
    }

    async cleanup(): Promise<any> {
        return await this.resourceService.deleteCollections([{"Name": this.collectionName}]);
     }
}
