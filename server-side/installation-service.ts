
import semver from 'semver';
import { AddonDataScheme, PapiClient } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server/dist';

export class InstallationService {

    papiClient: PapiClient
    addonUUID: string;
    oldTableName: string = "RelationsWithExternalID";
    newTableName: string = "related_items"

    
    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client["ActionUUID"]
        });
        this.addonUUID = client.AddonUUID;
    }

        // migrate from the old ADAL schema RelationsWithExternalID the the new one
        async performMigration(fromVersion) {
            try{
                await this.migrateToV1_1_x(fromVersion);
                return { success: true, resultObject: {}};
            }
            catch(e) {
                console.log("Migration failed with the following error:" , e);
                return { success: false, resultObject: {}};
            }
        }
    
        private async migrateToV1_1_x(fromVersion) {
            if (fromVersion && semver.lt(fromVersion, '1.1.0')) {
                const ansFromCreateSchemes = await this.createNewScheme();
                if (ansFromCreateSchemes.success === true) {
                    await this.handleSchemeData(); // export from the old scheme and import to the new one
                }
                else {
                    throw new Error(`Failed to create related_items scheme`);
                }
            }
        }

        private async createNewScheme(){
            var relatedItemsScheme: AddonDataScheme = {
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
                        Items:{
                            Type: 'String'
                        }
                    }
                }
            };

            try {
                await this.papiClient.addons.data.schemes.post(relatedItemsScheme);
                return {
                    success: true,
                    errorMessage: ""
                }
            }
            catch(e) {
                console.log("Migration failed with the following error:" , e);
                return {
                    success: true,
                    errorMessage: "Failed to create related_items scheme"
                }
            }
        }

        private async handleSchemeData(){
            const fileURI = await this.exportRelationsWithExternalID();
            if (fileURI) {
                const ansFromImport = await this.importExportedFileTorelatedItemsScheme(fileURI);
                const ansFromAuditLog = await this.pollExecution(this.papiClient, ansFromImport.ExecutionUUID);
                if (ansFromAuditLog.success === true) {
                    this.purgeOldScheme();
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
            const auditLog = await this.papiClient.post(`/addons/data/export/file/${this.client.AddonUUID}/${this.oldTableName}`, body);
            return this.getURIFromAuditLog(auditLog);
            
        }

        private async importExportedFileTorelatedItemsScheme(fileURI) {
            const body = {
                URI: fileURI
            };
            return this.papiClient.post(`/addons/data/import/file/${this.client.AddonUUID}/related_items`, body);
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

        private async purgeOldScheme() {
            return await this.papiClient.post(`/addons/data/schemes/${this.oldTableName}/purge`, {});
        }
}