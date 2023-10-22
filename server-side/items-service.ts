import { AddonData, PapiClient, SearchBody, SearchData } from '@pepperi-addons/papi-sdk';
import split from 'just-split';

export class ItemsService {
    maxChunkSize = 500;
    constructor(private papiClient: PapiClient) {
    }

    async getItemsByExternalID(externalIdsArray: string[], fields: string[], uniqueFieldID: string): Promise<Map<string, any>> {
        const chunks = split(externalIdsArray, this.maxChunkSize);
        const itemsMap = new Map<string, any>();
        await Promise.all(chunks.map(async chunk => {
            const searchBody: SearchBody = {
                Fields: fields,
                UniqueFieldID: uniqueFieldID,
                UniqueFieldList: [...chunk]
            }
            console.log(`getItemsByExternalID searchBody: ${JSON.stringify(searchBody)}`);
            let items: SearchData<AddonData>;
            try {
                items = await this.papiClient.resources.resource('items').search(searchBody) as SearchData<AddonData>;
            }
            catch (err){
                console.error(`getItemsByExternalID error: `, err);
                throw err;
            }

            console.log(`getItemsByExternalID items: ${JSON.stringify(items)}`);
            items.Objects.forEach(item => {
                itemsMap.set(item.ExternalID, item);
            });
        }));
        return itemsMap;
    }
}
