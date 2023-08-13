import { PapiClient } from '@pepperi-addons/papi-sdk/dist/papi-client';
import { Collection, DataImportInput, FileImportInput, FindOptions } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server/dist';
import { ItemRelations, RELATED_ITEM_CPI_META_DATA_TABLE_NAME, RELATED_ITEM_META_DATA_TABLE_NAME } from '../../../shared/entities';

export class ResourceService {

    addonUUID: string;

    constructor(private papiClient: PapiClient, client: Client) {
        this.addonUUID = client.AddonUUID;
    }

    sleep = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    };

    async importData(body: DataImportInput) {
        return await this.papiClient.resources.resource("related_items").import.data(body);
    }

    async importFile(body: FileImportInput) {
        return this.papiClient.resources.resource("related_items").import.file().post(body);
    }

    async deleteCollections(body: Collection[]) {
        return await this.papiClient.post(`/addons/api/${this.addonUUID}/api/delete_collections`, body);
    }

    async deleteItems(itemsToDelete: ItemRelations[]) {
        itemsToDelete.map(async (item) => {
            return item.Hidden = true;
        });
        const dimxObj: DataImportInput = {
            "Objects": itemsToDelete
        }
        return await this.importData(dimxObj);
    }

    async upsertSingleEntity(body: ItemRelations) {
        return await this.papiClient.resources.resource("related_items").post(body);
    }

    async getItemsRelations(query: FindOptions) {
        return await this.papiClient.resources.resource("related_items").get(query);
    }

    // get as parameter itemRelation and return the corresponding cpi-item
    async getCPIItemsRelations(item: ItemRelations) {
        const itemUUID = await this.getItemsUUID([item.ItemExternalID]) as any;
        const CPIItemkey = `${item.CollectionName}_${itemUUID[0].UUID}`;
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(RELATED_ITEM_CPI_META_DATA_TABLE_NAME).find(
            {
                where: `Key='${CPIItemkey}'`
            }
        );
    }

    async getItemsUUID(itemsExternalIDs) {
        if (itemsExternalIDs && itemsExternalIDs.length > 0) {
            let externelIDsList = '(' + itemsExternalIDs.map(id => `'${id}'`).join(',') + ')';
            let query = { fields: ['UUID'], where: `ExternalID IN ${externelIDsList}` }
            return await this.papiClient.items.find(query)
        }
        return [];
    }

    async callAuditLog(executionUUID: string) {
        const ansFromAuditLog = await this.pollExecution(this.papiClient, executionUUID);
        if (ansFromAuditLog.success === true) {
            return ansFromAuditLog.resultObject;
        }
    }

    async pollExecution(papiClient: PapiClient, ExecutionUUID: string, interval = 1000, maxAttempts = 60, validate = (res) => {
        return res != null && (res.Status.Name === 'Failure' || res.Status.Name === 'Success');
    }) {
        let attempts = 0;

        const executePoll = async (resolve, reject) => {
            const result = await papiClient.get(`/audit_logs/${ExecutionUUID}`);
            attempts++;

            if (validate(result)) {
                return resolve({ "success": result.Status.Name === 'Success', "errorCode": 0, 'resultObject': result.AuditInfo.ResultObject });
            }
            else if (maxAttempts && attempts === maxAttempts) {
                return resolve({ "success": false, "errorCode": 1 });
            }
            else {
                setTimeout(executePoll, interval, resolve, reject);
            }
        };

        return new Promise<any>(executePoll);
    }
}


