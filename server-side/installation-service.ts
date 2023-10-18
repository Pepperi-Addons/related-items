
import { AddonDataScheme, PapiClient } from '@pepperi-addons/papi-sdk';
import semver from 'semver';
import config from '../addon.config.json';
import { RELATED_ITEM_META_DATA_TABLE_NAME, PFS_TABLE_NAME } from 'shared';

export class InstallationService {

    oldTableName = "RelationsWithExternalID";
    newTableName = "related_items"

    constructor(private papiClient: PapiClient) {
    }

    // migrate from the old ADAL schema RelationsWithExternalID the the new one
    async performMigration(fromVersion): Promise<{ success: boolean, resultObject: any}> {
        try {
            await this.migrateToV1_1_x(fromVersion);
            return { success: true, resultObject: {} };
        }
        catch (e) {
            console.log("Migration failed with the following error:", e);
            return { success: false, resultObject: {} };
        }
    }
    // eslint-disable-next-line
    private async migrateToV1_1_x(fromVersion) {
        if (fromVersion && semver.lt(fromVersion, '1.1.0')) {
            const ansFromCreateSchemes = await this.createRelatedItemsScheme();
            if (ansFromCreateSchemes.success === true) {
                await this.createPNSSubscription();
                await this.createPFSResource();
                await this.handleSchemeData(); // export from the old scheme and import to the new one
            }
            else {
                throw new Error(`Failed to create related_items scheme`);
            }
        }
    }
    createPNSSubscription() {
        return this.papiClient.notification.subscriptions.upsert({
            AddonUUID: config.AddonUUID,
            AddonRelativeURL: "/api/triggered_by_pns",
            Type: "data",
            Name: "subscriptionToRelatedItems",
            FilterPolicy: {
                Action: ['update', 'insert'],
                Resource: [RELATED_ITEM_META_DATA_TABLE_NAME],
                AddonUUID: [config.AddonUUID]
            }
        });
    }

    // PFS Scheme - for import file test
    async createPFSResource() {
        const pfsScheme: AddonDataScheme = {
            "Name": PFS_TABLE_NAME,
            "Type": 'pfs'
        }
        await this.papiClient.addons.data.schemes.post(pfsScheme);
    }

    async createRelatedItemsScheme() {
        const relatedItemsScheme: AddonDataScheme = this.getRelatedItemsScheme();
        try {
            await this.papiClient.addons.data.schemes.post(relatedItemsScheme);
            return {
                success: true,
                errorMessage: ""
            }
        }
        catch (e) {
            console.log("Migration failed with the following error:", e);
            return {
                success: true,
                errorMessage: "Failed to create related_items scheme"
            }
        }
    }

    private getRelatedItemsScheme(): AddonDataScheme {
        return {
            Name: this.newTableName,
            Type: 'data',
            GenericResource: true,
            Fields: {
                ItemExternalID: {
                    Type: 'String'
                },
                CollectionName: {
                    Type: 'String'
                },
                RelatedItems: {
                    Type: 'Array',
                    Items: {
                        Type: 'String'
                    }
                }
            }
        }
    }

    private async handleSchemeData() {
        const fileURI = await this.exportRelationsWithExternalID();
        if (fileURI) {
            const ansFromImport = await this.importFileToRelatedItems(fileURI);
            const ansFromAuditLog = await this.pollExecution(this.papiClient, ansFromImport.ExecutionUUID);
            if (ansFromAuditLog.success === true) {
                await this.purgeOldScheme();
            }
        }
        else {
            console.log("No scheme to migrate")
        }
    }

    private async exportRelationsWithExternalID() {
        const body = {
            DIMXExportFormat: "csv",
            DIMXExportIncludeDeleted: false,
            DIMXExportFileName: "export",
            DIMXExportFields: "CollectionName,ItemExternalID,RelatedItems",
            DIMXExportDelimiter: ","
        }
        const auditLog = await this.papiClient.post(`/addons/data/export/file/${config.AddonUUID}/${this.oldTableName}`, body);
        return this.getURIFromAuditLog(auditLog);

    }

    private async importFileToRelatedItems(fileURI) {
        const body = {
            URI: fileURI
        };
        return this.papiClient.post(`/addons/data/import/file/${config.AddonUUID}/related_items`, body);
    }

    private async getURIFromAuditLog(auditLog) {
        const ansFromAuditLog = await this.pollExecution(this.papiClient, auditLog.ExecutionUUID);
        if (ansFromAuditLog.success === true) {
            return JSON.parse(ansFromAuditLog.resultObject).URI;
        }
        else {
            throw new Error(`Failed to create related_items scheme`);
        }
    }

    async pollExecution(papiClient: PapiClient, ExecutionUUID: string, interval = 1000, maxAttempts = 60, validate = (res) => {
        return res !== null && (res.Status.Name === 'Failure' || res.Status.Name === 'Success');
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

    private async purgeOldScheme() {
        return await this.papiClient.post(`/addons/data/schemes/${this.oldTableName}/purge`, {});
    }
}
