
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server'
import { AddonDataScheme, PapiClient } from '@pepperi-addons/papi-sdk'

export async function install(client: Client, request: Request): Promise<any> {

    const papiClient = new PapiClient({
        baseURL: client.BaseURL, 
        token: client.OAuthAccessToken,
        addonUUID: client.AddonUUID,
        addonSecretKey: client.AddonSecretKey,
        actionUUID: client["ActionUUID"]
    }); 

    await createADALSchemes(papiClient);

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

async function createADALSchemes(papiClient: PapiClient) {
    var collectionsScheme: AddonDataScheme = {
        Name: 'Collection',
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
        Name: 'Relations',
        Type: 'cpi_meta_data'
    };
    await papiClient.addons.data.schemes.post(collectionsScheme);
    await papiClient.addons.data.schemes.post(relationsScheme);
}