import { AddonData, PapiClient, SearchBody, SearchData } from '@pepperi-addons/papi-sdk';
import { PageNumberBuildOperations } from '@pepperi-addons/modelsdk';
import config from '../../addon.config.json';
import { ItemRelations } from 'shared/entities';

// this class is used for the  transition from temporary scheme to related_items scheme
export class SchemeBuildOperaton implements PageNumberBuildOperations<AddonData,AddonData,any> {

    constructor(private papiClient: PapiClient, private schemeName: string) {}

    // get items from temporary scheme
    async searchObjectsByPage(page: number, pageSize: number, additionalFields?: string): Promise<SearchData<AddonData>> {
        const searchBody: SearchBody = {
			PageSize: pageSize, 
            Page: page
		}
		return await this.papiClient.addons.data.search.uuid(config.AddonUUID).table(this.schemeName).post(searchBody) as any;
    }
        // the fix happened when transferring the data from related_items scheme to temporary scheme
        fixObjects(objects: AddonData[]) {
            return objects;
        }

    // add the items to the temporary scheme
    async batchUpsert(resourceName: string, objects: AddonData[]): Promise<any[]> {
        const body = { 
            Objects: objects
        };
        return await this.papiClient.apiCall('POST', `/addons/data/batch/${config.AddonUUID}/${resourceName}`, body);
    }
}