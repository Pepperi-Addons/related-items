import { TEMPORARY_MIGRATION_SCHEME, RELATED_ITEM_META_DATA_TABLE_NAME } from "shared"
import { InstallationService } from "../installation-service";
import { BaseSchemeTrasferDataDelegete } from "./scheme-build-operation";
import { RemoveWhiteSpacesBuildOperaton as RemoveWhiteSpacesDelegate } from "./remove-spaces-build-operation";
import { AddonData, PapiClient } from "@pepperi-addons/papi-sdk";
import { PageNumberBuildOperations, PageNumberBuilder } from '@pepperi-addons/modelsdk';

export class MigrateRelatedItemsSchema {
    constructor(private installtionSerivce: InstallationService, private papiClient: PapiClient) {
    }

    // eslint-disable-next-line
    migrateToV1_2_X() {
        return this.removeWhiteSpacesFromItemRelationsKeys();
    }

    // replace white spaces of the existing Item Relation Key with underscore using PageNumberBuildOperations
    private async removeWhiteSpacesFromItemRelationsKeys() {
        // create temporary scheme to save data
        await this.installtionSerivce.createRelatedItemsScheme(TEMPORARY_MIGRATION_SCHEME);

        // create delegate calsses to help with the migration(using modelSDK)
        const toTemporarySchemeDelegete = new BaseSchemeTrasferDataDelegete(this.papiClient, RELATED_ITEM_META_DATA_TABLE_NAME);
        const fromTemporaryDelegate = new RemoveWhiteSpacesDelegate(this.papiClient, TEMPORARY_MIGRATION_SCHEME);

        // move data from "related_items" to temporary scheme
        await this.copyDataToScheme(TEMPORARY_MIGRATION_SCHEME, toTemporarySchemeDelegete);
        // remove all data from 'related_items' scheme
        await this.TruncateRelatedItemsScheme();
        // move data from temporary scheme to "related_items" scheme
        await this.copyDataToScheme(RELATED_ITEM_META_DATA_TABLE_NAME, fromTemporaryDelegate);
        // purge temporary scheme
        await this.installtionSerivce.purgeScheme(TEMPORARY_MIGRATION_SCHEME);

    }


    private async TruncateRelatedItemsScheme() {
        let res = false
        const truncateAns = await this.papiClient.post(`/addons/data/schemes/${RELATED_ITEM_META_DATA_TABLE_NAME}/truncate`, {});
        if (truncateAns.Done === true) {
            res = true;
        } else {
            throw new Error("Failed to truncate related_items scheme");
        }
    }

    async copyDataToScheme(targateScheme: string, buildOperation: PageNumberBuildOperations<AddonData, AddonData, any>) {
        const buildBody: any = {};
        const copyService = new PageNumberBuilder(targateScheme, buildOperation);
		return await copyService.buildTable(buildBody);
    }
}
