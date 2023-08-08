import { Client } from "@pepperi-addons/debug-server/dist"
import { ImportDataBaseCommand } from "./import-data-base-command"
import { ItemRelations } from "shared";

export class ImportNotExistingItemCommand extends ImportDataBaseCommand {
    constructor(client: Client){
        super(client, 'import-not-existing-item')
    }

    async initData(): Promise<ItemRelations[]> {
        var relations: ItemRelations[] = [];
        //item that contains item that not exist in its related items
        let firstItem: ItemRelations = {
            "CollectionName": this.collectionName,
            "ItemExternalID": this.items[0].ExternalID,
            "RelatedItems": [this.items[1].ExternalID, this.items[2].ExternalID, 'notExistingItem']
        }
        //item points to itself 
        let secondItem: ItemRelations = {
            "CollectionName": this.collectionName,
            "ItemExternalID": this.items[1].ExternalID,
            "RelatedItems": [this.items[2].ExternalID, this.items[1].ExternalID]
        }  
        relations.push(firstItem);
        relations.push(secondItem);
        return relations;
    }

    async test(res: any, data: any, expect: Chai.ExpectStatic): Promise<any> {
        this.mockItemRelationsData.map(async item => {
            // fisrt item - pop the not existing item
            // second item - pop the related item that identical to the primary item
            item.RelatedItems?.pop();
            const adalItem = await this.resourceService.getItemsRelations({
                where: `Key='${this.collectionName}_${item.ItemExternalID}'`});
                expect(item.ItemExternalID).to.equal(adalItem[0].ItemExternalID);
                expect(item.RelatedItems).to.deep.equal(adalItem[0].RelatedItems);
        });
    }
}