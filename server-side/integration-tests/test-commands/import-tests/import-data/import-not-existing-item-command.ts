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

    async processTestAction(testActionRes){
        return testActionRes;
    }

    async test(res: any, data: any, expect: Chai.ExpectStatic): Promise<any> {
        const firstItem: ItemRelations = await this.resourceService.getItemsRelations({
            where: `Key='${this.mockItemRelationsData[0].CollectionName}_${this.mockItemRelationsData[0].ItemExternalID}'`}).then(objs => objs[0]);
        // check that the not existing item removed from the related items
        expect(firstItem.RelatedItems).to.deep.equal([this.items[1].ExternalID, this.items[2].ExternalID]);

        // check that the related item that identical to the primary item removed from the related items
        const secondItem: ItemRelations = await this.resourceService.getItemsRelations({
            where: `Key='${this.mockItemRelationsData[1].CollectionName}_${this.mockItemRelationsData[1].ItemExternalID}'`}).then(objs => objs[0]);
        expect(secondItem.RelatedItems).to.deep.equal([this.items[2].ExternalID]);
    }
}