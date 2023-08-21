import RelatedItemsService from './related-items.service'
import { Client, Request } from '@pepperi-addons/debug-server'

// Generic resource implementation
export async function related_items(client: Client, request: Request): Promise<any>
 {
    const service = new RelatedItemsService(client)

    if (request.method === 'POST') {
        return service.upsertItemRelations(request.body);
    }
    else if (request.method === 'GET') {
        return service.getRelatedItems(request.query);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function get_related_items_by_key(client: Client, request: Request): Promise<any>
 {
    const service = new RelatedItemsService(client)

    if (request.method === 'GET') {
        return service.getItemRelationEntity(request.query.key);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

// Collection table endpoints
export async function collections(client: Client, request: Request): Promise<any>
 {
    const service = new RelatedItemsService(client)

    if (request.method === 'GET') {
        return service.getCollections(request.query);
    }
    else if (request.method === 'POST') {
        return service.upsertRelatedCollection(request.body)
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function delete_collections(client: Client, request: Request): Promise<any>
 {
    const service = new RelatedItemsService(client)

    if (request.method === 'POST') {
        return service.deleteCollections(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function triggered_by_pns(client: Client, request: Request): Promise<any> {
    const service = new RelatedItemsService(client)

    await service.trigeredByPNS(request.body);
}

// RELATED_ITEM_META_DATA_TABLE_NAME endpoints

export async function relation(client: Client, request: Request): Promise<any>
 {
    const service = new RelatedItemsService(client)

    if (request.method === 'GET') {
        return service.getRelationsItemsWithExternalID(request.query);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function delete_relations(client: Client, request: Request): Promise<any>
 {
    const service = new RelatedItemsService(client)

    if (request.method === 'POST') {
        return service.deleteRelations(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function add_items_to_relation_with_externalid(client: Client, request: Request): Promise<any>
 {
    const service = new RelatedItemsService(client)

    if (request.method === 'POST') {
        return service.addItemsToRelationWithExternalID(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function remove_items_from_relation_with_externalid(client: Client, request: Request): Promise<any>
 {
    const service = new RelatedItemsService(client)

    if (request.method === 'POST') {
        return service.removeItemsFromRelationWithExternalID(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

//Items endpoints

export async function get_items(client: Client, request: Request): Promise<any>
 {
    const service = new RelatedItemsService(client)

    if (request.method === 'GET') {
        return service.getItems(request.query);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

// ATD functions

export async function atd_fields(client: Client, request: Request): Promise<any>
 {
    const service = new RelatedItemsService(client)

    if (request.method === 'GET') {
        return service.getItemsFromFieldsTable(request.query);
    }
    else if (request.method === 'POST') {
        return service.upsertItemsInFieldsTable(request.body)
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function delete_atd_fields(client: Client, request: Request): Promise<any>
 {
    const service = new RelatedItemsService(client)

    if (request.method === 'POST') {
        return service.deleteAtdFields(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function create_tsa_field(client: Client, request: Request): Promise<any>
 {
    const service = new RelatedItemsService(client)

    if (request.method === 'POST') {
        return service.createAtdTransactionLinesFields(request.body);
    }
    else if (request.method === 'GET') {
        throw new Error(`Method ${request.method} not supported`);
    }
}

// Import-Export ATD

export async function import_atd_fields(client: Client, request: Request): Promise<any> {
    const service = new RelatedItemsService(client)
    if (request.method === 'POST') {
        return service.importATDFields(request.body);
    }
    else if (request.method === 'GET') {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function export_atd_fields(client: Client, request: Request): Promise<any>
 {
    const service = new RelatedItemsService(client)
    if (request.method === 'GET') {
        return service.exportATDFields(request.query);
    }
    else if (request.method === 'POST') {
        throw new Error(`Method ${request.method} not supported`);
    }
}

    // DIMX
// endpoints for the AddonRelativeURL of the relation
export async function import_data_source(client: Client, request: Request): Promise<any> {
    const service = new RelatedItemsService(client)
    if (request.method === 'POST') {
        return service.importDataSource(request.body);
    }
    else if (request.method === 'GET') {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function export_data_source(client: Client, request: Request): Promise<any> {
    const service = new RelatedItemsService(client)
    if (request.method === 'POST') {
       return service.exportDataSource(request.body);
    }
    else if (request.method === 'GET') {
        throw new Error(`Method ${request.method} not supported`);
    }
}
// usage monitor
export async function collection_data(client: Client, request: Request): Promise<any> {
    const service = new RelatedItemsService(client);

    if (request.method === 'GET') {
        return await service.getNumberOfCollectionsUsageData()
    }
    else {
        throw new Error(`Method ${request.method} is not supported`)
    }
}

export async function total_lines_in_collection_data(client: Client, request: Request): Promise<any> {
    const service = new RelatedItemsService(client);

    if (request.method === 'GET') {
        return await service.getTotalNumberOfLinesInCollectionsUsageData()
    }
    else {
        throw new Error(`Method ${request.method} is not supported`)
    }
}


