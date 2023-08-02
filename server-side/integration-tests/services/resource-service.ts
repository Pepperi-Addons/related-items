import { PapiClient } from '@pepperi-addons/papi-sdk/dist/papi-client';
import { Collection, DataImportInput, FileImportInput } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server/dist';
import { ItemRelations } from '../../../shared/entities';

export class ResourceService {

    addonUUID: string;

    constructor(private papiClient: PapiClient, client: Client) {
        this.addonUUID = client.AddonUUID;
    }

    async importData(body: DataImportInput) {
        return await this.papiClient.resources.resource("related_items").import.data(body);
    }

    async importFile(body: FileImportInput) {
        return this.papiClient.resources.resource("related_items").import.file().post(body);
    }

    async deleteCollections(body: Collection[]) {
        return await this.papiClient.post(`/addons/api/${this.addonUUID}/api/delete_collections`, body);
    }

    async upsertSingleEntity(body: ItemRelations) {
        return await this.papiClient.resources.resource("related_items").post(body);
    }

    async getItemsRelations(query: string) {
        return await this.papiClient.get(`/addons/api/${this.addonUUID}/api/relation?${query}`);
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

    async DownloadResultArray(downloadURL): Promise<any[]> {
        console.log(`OutputArrayObject: Downloading file`);
        try {
            const response = await fetch(downloadURL);
            const data: string = await response.text();
            const DIMXObjectArr: any[] = JSON.parse(data);
            return DIMXObjectArr;
        }
        catch (ex) {
            console.log(`DownloadResultArray: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }
}


