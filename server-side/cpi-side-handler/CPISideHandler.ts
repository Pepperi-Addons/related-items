
import { PapiClient } from "@pepperi-addons/papi-sdk";
import { ItemRelations, RELATED_ITEM_CPI_META_DATA_TABLE_NAME, RELATED_ITEM_META_DATA_TABLE_NAME } from "shared";
import config from "../../addon.config.json";
import { ItemsService } from "../items-service";
import async from 'async';

// this class converts item relations to cpi side format
// cpi side format is to use uuids instead of external ids (for items)
export class CPISideHanler {
    constructor(private papiClient: PapiClient) {
    }

    async handlePNS(body: any) {
        const itemsRelationsKeys = body.Message.ModifiedObjects.map(obj => obj.ObjectKey);
        // the keys are in the format of: "{CollectionName}_ItemExternalID"
        console.log("itemsRelationsKeys: ", itemsRelationsKeys);
        // get all items relations objects
        const itemsRelations = await this.getRelatedItemsByKeyList(itemsRelationsKeys);
        // replace external ids with uuids
        const items = await this.getItemsMap(itemsRelations);
        // convert itemsRelations to CPI format
        const itemsRelationWithUUID = this.convertToCPIFormat(itemsRelations, items);

        // update related items CPI table - with uuids
        return await this.updateRelatedItemsTable(itemsRelationWithUUID);
    }

    // get items mapped by external id
    // params: itemsRelations - array of items relations objects
    async getItemsMap(itemsRelations: ItemRelations[]): Promise<Map<string, any>> {
        // get all distinct external ids
        const distinctExternalIDs = this.getDistinctExternalIDsArray(itemsRelations);

        // get all items mapped by external id
        const items = await this.getItemsMappedByExternalID(distinctExternalIDs);

        return items
    }

    // batch update related items table for CPI
    private async updateRelatedItemsTable(itemsRelations: ItemRelations[]) {
        console.log(`updateRelatedItemsTable itemsRelations: ${JSON.stringify(itemsRelations)}`);
        // bulk upsert is not supported for cpi_meta_data type
        // so we need to use async mapLimit that will affects performance
        const ans = await async.mapLimit(
            itemsRelations,
            5,
            async (item) => {
                console.log(`async mapLimit item before: ${JSON.stringify(item)}`);
                const cpiAns = await this.papiClient.addons.data.uuid(config.AddonUUID).table(RELATED_ITEM_CPI_META_DATA_TABLE_NAME).upsert(item);
                console.log(`Ans from cpi-upsert : ${JSON.stringify(cpiAns)}, with item: ${JSON.stringify(item)}`);
                return cpiAns;
            }
        );
        console.log(`async mapLimit ans: ${JSON.stringify(ans)}`);
        return ans;
    }

    // get all items mapped by external id
    private async getItemsMappedByExternalID(externalIdsArray: string[]): Promise<Map<string, any>> {
        const itemsService = new ItemsService(this.papiClient);
        const itemsMap = await itemsService.getItemsByExternalID(externalIdsArray, [
            "ExternalID",
            "Key"
        ], "ExternalID");

        console.log(`itemsMap: ${JSON.stringify(itemsMap)}`);

        return itemsMap;
    }

    // convert itemsRelations to CPI format
    // cpi side uses UUIDs instead of external ids
    // so we need to convert the external ids to UUIDs
    private convertToCPIFormat(itemsRelations: ItemRelations[], items: Map<string, any>): ItemRelations[] {
        const itemsRelationsForCPI = itemsRelations.map(itemRelation => {
            // get primary item uuid
            const item = items.get(itemRelation.ItemExternalID!);
            console.log(`@@@item: ${item}`);
            if (item && item.Key !== undefined) {
                const itemUUID = item.Key;
                if (!itemUUID) {
                    console.error(`itemUUID was not found for itemExternalID: ${itemRelation.ItemExternalID}`);
                }
                // get related items uuids
                const relatedItemsUUIDs = itemRelation.RelatedItems?.map(ri => {
                    const riObj = items.get(ri);
                    if (riObj && riObj.Key !== undefined) {
                        return riObj.Key;
                    }
                    else {
                        console.log(`@@@Key was not found for ri: ${riObj}`);
                    }
                });
                console.log(`@@@itemUUID: ${itemUUID} relatedItemsUUIDs: ${relatedItemsUUIDs}`);
                const key = `${itemRelation.CollectionName}_${itemUUID}`;

                const cpiRelationItem = { 'Key': key, 'Hidden': itemRelation.Hidden, RelatedItems: relatedItemsUUIDs }
                console.log(`@@@cpiRelationItem ${cpiRelationItem.Key} was created`);
                return cpiRelationItem as ItemRelations;
            }
        });
        console.log(`@@@itemsRelationsForCPI: ${JSON.stringify(itemsRelationsForCPI)}`);
        const res = itemsRelationsForCPI.filter(item => item !== undefined) as ItemRelations[];
        return res;
    }
    // get related items object by key list
    private async getRelatedItemsByKeyList(keyList: string[]): Promise<ItemRelations[]> {
        const itemRelations = await this.papiClient.addons.data.search.uuid(config.AddonUUID).table(RELATED_ITEM_META_DATA_TABLE_NAME).post({ KeyList: keyList }) as any;
        console.log(`getRelatedItemsByKeyList itemRelations: ${JSON.stringify(itemRelations)}`);
        return itemRelations.Objects;
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
