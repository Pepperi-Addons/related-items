
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server'
import { AddonDataScheme, PapiClient } from '@pepperi-addons/papi-sdk'
import {COLLECTION_TABLE_NAME, RELATED_ITEM_CPI_META_DATA_TABLE_NAME, RELATED_ITEM_META_DATA_TABLE_NAME, RELATED_ITEM_ATD_FIELDS_TABLE_NAME} from '../shared/entities'
import RelatedItemsService from './related-items.service'

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

    return {success:true,resultObject:{}}
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
}

export async function upgrade(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
}

async function createRelations(papiClient: PapiClient) {
    let relation = {
        RelationName: "TransactionTypeListTabs",
        AddonUUID: "4f9f10f3-cd7d-43f8-b969-5029dad9d02b",
        Name:"RelatedItemsRelation",
        Description:"Related Items",
        Type:"NgComponent",
        AddonRelativeURL:"atd_editor",
        SubType: "NG11",
        ModuleName: 'AtdEditorModule',
        ComponentName: 'AtdEditorComponent'
    }
    try {
        await papiClient.post('/addons/data/relations', relation);
        return {
            success: true,
            errorMessage: ""
        }
    }
    catch (err) {
        return {
            success: false,
            errorMessage: ('message' in err) ? err.message : 'Unknown Error Occured',
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

    var relatedItemsMetaDataScheme: AddonDataScheme = {
        Name: RELATED_ITEM_META_DATA_TABLE_NAME,
        Type: 'meta_data',
        Fields: {
            ItemExternalID: {
                Type: 'String'
            },
            CollectionName: {
                Type: 'String'
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
            errorMessage: ('message' in err) ? err.message : 'Unknown Error Occured',
        }
    }
}