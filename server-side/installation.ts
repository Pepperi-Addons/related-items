
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server'
import { AddonDataScheme, PapiClient } from '@pepperi-addons/papi-sdk'
import {COLLECTION_TABLE_NAME, RELATED_ITEM_CPI_META_DATA_TABLE_NAME, RELATED_ITEM_META_DATA_TABLE_NAME, RELATED_ITEM_ATD_FIELDS_TABLE_NAME, Relation} from '../shared/entities'
import RelatedItemsService from './related-items.service'
import config from '../addon.config.json';``

export async function install(client: Client, request: Request): Promise<any> {
    const service = new RelatedItemsService(client)

    const papiClient = new PapiClient({
        baseURL: client.BaseURL,
        token: client.OAuthAccessToken,
        addonUUID: client.AddonUUID,
        addonSecretKey: client.AddonSecretKey,
        actionUUID: client["ActionUUID"]
    });

    await createADALSchemes(papiClient);
    await service.createPNSSubscription();
    await createRelations(papiClient);

    return { success: true, resultObject: {} }
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    return { success: true, resultObject: {} }
}

export async function upgrade(client: Client, request: Request): Promise<any> {
    //TODO: Check if needed
    const papiClient = new PapiClient({
        baseURL: client.BaseURL,
        token: client.OAuthAccessToken,
        addonUUID: client.AddonUUID,
        addonSecretKey: client.AddonSecretKey,
        actionUUID: client["ActionUUID"]
    });
    await createRelations(papiClient);
    return { success: true, resultObject: {} }
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    return { success: true, resultObject: {} }
}

async function createRelations(papiClient: PapiClient) {
    let relations: Relation[] = [
        {
            RelationName: "TransactionTypeListTabs",
            AddonUUID: "4f9f10f3-cd7d-43f8-b969-5029dad9d02b",
            Name: "RelatedItemsRelation",
            Description: "Related Items",
            Type: "NgComponent",
            AddonRelativeURL: "related_items",
            SubType: "NG14",
            ModuleName: 'AtdEditorModule',
            ComponentName: 'AtdEditorComponent',
            ElementsModule: 'WebComponents',
            ElementName: `settings-element-${config.AddonUUID}`
        },
        {
            RelationName: "ATDImport",
            AddonUUID: "4f9f10f3-cd7d-43f8-b969-5029dad9d02b",
            Name: "RelatedItemsRelation",
            Description: "Relation from Related-Items addon to ATD Import addon",
            Type: "AddonAPI",
            AddonRelativeURL: "/api/import_atd_fields"
        },
        {
            RelationName: "ATDExport",
            AddonUUID: "4f9f10f3-cd7d-43f8-b969-5029dad9d02b",
            Name: "RelatedItemsRelation",
            Description: "Relation from Related-Items addon to ATD Export addon",
            Type: "AddonAPI",
            AddonRelativeURL: "/api/export_atd_fields"
        },
        {
            RelationName: "DataExportResource",
            AddonUUID: "4f9f10f3-cd7d-43f8-b969-5029dad9d02b",
            Name: RELATED_ITEM_META_DATA_TABLE_NAME,
            Description: "Data Export Relation",
            Type: "AddonAPI",
            AddonRelativeURL: "/api/export_data_source"
        },
        {
            RelationName: "DataImportResource",
            AddonUUID: "4f9f10f3-cd7d-43f8-b969-5029dad9d02b",
            Name: RELATED_ITEM_META_DATA_TABLE_NAME,
            Description: "Data Import Relation",
            Type: "AddonAPI",
            AddonRelativeURL: "/api/import_data_source"
        },
        {
            RelationName: "UsageMonitor",
            AddonUUID: "4f9f10f3-cd7d-43f8-b969-5029dad9d02b",
            Name: "NumberOfCollectionsUsageMonitor",
            Description: 'relation for "data" tab in usage monitor to display number of Relates Items collections',
            Type: "AddonAPI",
            AddonRelativeURL: "/api/collection_data"
        },
        {
            RelationName: "UsageMonitor",
            AddonUUID: "4f9f10f3-cd7d-43f8-b969-5029dad9d02b",
            Name: "UsageMonitor",
            Description: 'relation for "data" tab in usage monitor to display number of lines in Relates Items collections',
            Type: "AddonAPI",
            AddonRelativeURL: "/api/total_lines_in_collection_data"
        },
        {
            RelationName: "SettingsBlock",
            GroupName: 'Related_Items',
            SlugName: 'collections',
            Name: 'CollectionsList',
            Description: 'Collection Managment',
            Type: "NgComponent",
            SubType: "NG14",
            AddonUUID: config.AddonUUID,
            AddonRelativeURL: 'related_items',
            ComponentName: `CollectionsListComponent`,
            ModuleName: `CollectionsListModule`,
            ElementsModule: 'WebComponents',
            ElementName: `settings-element-${config.AddonUUID}`
        }
    ];
    try {
        relations.forEach(async (singleRelation) => {
            await papiClient.post('/addons/data/relations', singleRelation);
        });
        return {
            success: true,
            errorMessage: ""
        }
    }
    catch (err) {
        return {
            success: false,
            errorMessage:  err ? err : 'Unknown Error Occured',
        }
    }
}

async function createADALSchemes(papiClient: PapiClient) {
    var collectionsScheme: AddonDataScheme = {
        Name: COLLECTION_TABLE_NAME,
        Type: 'meta_data',
        Fields: {
            Name: {
                Type: 'String'
            },
            Description: {
                Type: 'String'
            }
        }
    };

    var relationsScheme: AddonDataScheme = {
        Name: RELATED_ITEM_CPI_META_DATA_TABLE_NAME,
        Type: 'cpi_meta_data'
    };

    var relatedItemsMetaDataScheme: any = {
        Name: RELATED_ITEM_META_DATA_TABLE_NAME,
        Type: 'meta_data',
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
    var relatedItemsAtdFieldsScheme: AddonDataScheme = {
        Name: RELATED_ITEM_ATD_FIELDS_TABLE_NAME,
        Type: 'cpi_meta_data'
    };
    try {
        await papiClient.addons.data.schemes.post(collectionsScheme);
        await papiClient.addons.data.schemes.post(relationsScheme);
        await papiClient.addons.data.schemes.post(relatedItemsMetaDataScheme);
        await papiClient.addons.data.schemes.post(relatedItemsAtdFieldsScheme);

        return {
            success: true,
            errorMessage: ""
        }
    }
    catch (err) {
        return {
            success: false,
            errorMessage: err ? err : 'Unknown Error Occured',
        }
    }
}