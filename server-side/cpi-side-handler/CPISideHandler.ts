
import { BatchApiResponse, PapiClient} from "@pepperi-addons/papi-sdk";
import { ItemRelations, RELATED_ITEM_CPI_META_DATA_TABLE_NAME, RELATED_ITEM_META_DATA_TABLE_NAME } from "shared";
import config from "../../addon.config.json";
import { ItemsService } from "../items-service";

// this class converts item relations to cpi side format
// cpi side format is to use uuids instead of external ids (for items)
export class CPISideHanler {
    constructor(private papiClient: PapiClient) {
    }

    async handlePNS(body: any) {
        const itemsRelationsKeys = body.Message.ModifiedObjects;
        // the keys are in the format of: "{CollectionName}_ItemExternalID"
        console.log("itemsRelationsKeys: ", itemsRelationsKeys);

        // get all items relations objects
        const itemsRelations = await this.getRelatedItemsByKeyList(itemsRelationsKeys);

        // get all distinct external ids
        const distinctExternalIDs = this.getDistinctExternalIDsArray(itemsRelations);

        // get all items mapped by external id
        const items = await this.getItemsMappedByExternalID(distinctExternalIDs);

        // convert itemsRelations to CPI format
        const itemsRelationWithUUID = this.convertToCPIFormat(itemsRelations, items);

        // update related items CPI table - with uuids
        return await this.updateRelatedItemsTable(itemsRelationWithUUID);
    }

    // batch update related items table for CPI
    private async updateRelatedItemsTable(itemsRelations: ItemRelations[]): Promise<BatchApiResponse[]> {
        return await this.papiClient.addons.data.uuid(config.AddonUUID).table(RELATED_ITEM_CPI_META_DATA_TABLE_NAME).batch(itemsRelations);
    }

    // get all items mapped by external id
    private async getItemsMappedByExternalID(externalIdsArray: string[]): Promise<Map<string, any>> {
        const itemsService = new ItemsService(this.papiClient);
        const itemsMap = await itemsService.getItemsByExternalID(externalIdsArray, [
            "ExternalID",
            "UUID"
        ], "ExternalID");

        return itemsMap;
    }

    // convert itemsRelations to CPI format
    // cpi side uses UUIDs instead of external ids
    // so we need to convert the external ids to UUIDs
    private convertToCPIFormat(itemsRelations: ItemRelations[], items: Map<string, any>): ItemRelations[] {
        const itemsRelationsForCPI = itemsRelations.map(itemRelation => {
            // get primary item uuid
            const itemUUID = items.get(itemRelation.ItemExternalID!).UUID;
            if (!itemUUID) {
                console.error(`itemUUID was not found for itemExternalID: ${itemRelation.ItemExternalID}`);
                return undefined;
            }
            // get related items uuids
            const relatedItemsUUIDs = itemRelation.RelatedItems?.map(ri => items.get(ri).UUID);
            console.log(`@@@itemUUID: ${itemUUID} relatedItemsUUIDs: ${relatedItemsUUIDs}`);
            const key = `${itemRelation.CollectionName}_${itemUUID}`;
            const cpiRelationItem = { 'Key': key, 'Hidden': itemRelation.Hidden, RelatedItems: relatedItemsUUIDs }
            console.log(`@@@cpiRelationItem ${cpiRelationItem.Key} was created`);
            return cpiRelationItem as ItemRelations;
        });

        const res = itemsRelationsForCPI.filter(item => item !== undefined) as ItemRelations[];
        return res;
    }
    // get related items object by key list
    private async getRelatedItemsByKeyList(keyList: string[]): Promise<ItemRelations[]> {
        const itemRelations: ItemRelations[] = await this.papiClient.addons.data.search.uuid(config.AddonUUID).table(RELATED_ITEM_META_DATA_TABLE_NAME).post({KeyList: keyList}) as any;
        console.log(`getRelatedItemsByKeyList itemRelations: ${JSON.stringify(itemRelations)}`);
        return itemRelations;
    }

    // creates an string array of all the items external ids and related items external ids
    private getDistinctExternalIDsArray(itemsRelation: ItemRelations[]): string[] {
        const externalIDs = new Set<string>();

        itemsRelation.forEach(item => {
            if (item.ItemExternalID) {
                externalIDs.add(item.ItemExternalID);
            }
            item.RelatedItems?.forEach(relatedItem => {
                externalIDs.add(relatedItem);
            });
        });

        const res = Array.from(externalIDs);
        console.log(`getDistinctExternalIDsArray res: ${res}`);
        return res;
    }

}