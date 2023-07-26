import { PapiClient } from '@pepperi-addons/papi-sdk/dist/papi-client';
import { Collection, DataImportInput } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server/dist';

export class ResourceService {

    addonUUID: string;

    constructor(private papiClient: PapiClient, client: Client) {
        this.addonUUID = client.AddonUUID;
    }

    async importData(body: DataImportInput) {
        return await this.papiClient.resources.resource("related_items").import.data(body);
    }

    async deleteCollections(body: Collection[]) {
        return await  this.papiClient.post(`/addons/api/${this.addonUUID}/api/delete_collections`, body);
    }
}




