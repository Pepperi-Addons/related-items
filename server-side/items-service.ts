import { AddonData, PapiClient, SearchBody, SearchData } from '@pepperi-addons/papi-sdk';

export class ItemsService {
    maxChunkSize = 500;
    constructor(private papiClient: PapiClient) {
    }

    async getItemsByExternalID(externalIdsArray: string[], fields: string[], uniqueFieldID: string): Promise<Map<string, any>> {
        const chunks = this.splitToChunks(externalIdsArray, this.maxChunkSize);
        const itemsMap = new Map<string, any>();
        await Promise.all(chunks.map(async chunk => {
            const searchBody: SearchBody = {
                Fields: fields,
                UniqueFieldID: uniqueFieldID,
                UniqueFieldList: [...chunk]
            }
            const items = await this.papiClient.resources.resource('items').search(searchBody) as SearchData<AddonData>;
            items.Objects.forEach(item => {
                itemsMap.set(item.ExternalID, item);
            });
        }));
        return itemsMap;
    }
     // gets an array of items and max chuck size and splits the array of items to chunks according to the max chunk size
     private splitToChunks<T>(items: T[], maxKeysInChunk: number): T[][] {
        const numberOfKeys = items.length;
        const res: T[][] = []

        // get the number of chunks with no more than max keys in chunk
        const numberOfChunks = Math.ceil(numberOfKeys / maxKeysInChunk);

        // calculating equally the number of keys in every chunk
        const keysInChunk = Math.ceil(numberOfKeys / numberOfChunks)

        // splitting the array of keys to the desired chunks
        for (let i = 0; i < numberOfKeys; i += keysInChunk) {
            res.push(items.slice(i, i + keysInChunk));
        }

        console.log(`sliceKeysToChunks from ${items.length} keys to ${res.length} chunks`)
        return res;
    }
}
