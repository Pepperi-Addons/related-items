import { PapiClient } from '@pepperi-addons/papi-sdk/dist/papi-client';
import { Collection, DataImportInput, FileImportInput } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server/dist';

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
        return await  this.papiClient.post(`/addons/api/${this.addonUUID}/api/delete_collections`, body);
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


