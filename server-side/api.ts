import RelatedItemsService from './related-items.service'
import { Client, Request } from '@pepperi-addons/debug-server'

// Collection table endpoints
export async function collections(client: Client, request: Request) {
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

export async function delete_collections(client: Client, request: Request) {
    const service = new RelatedItemsService(client)

    if (request.method === 'POST') {
        return service.deleteCollections(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function triggered_by_pns(client: Client, request: Request) {
    const service = new RelatedItemsService(client)

    await service.trigeredByPNS(request.body);
}

// RELATED_ITEM_META_DATA_TABLE_NAME endpoints

export async function relation(client: Client, request: Request) {
    const service = new RelatedItemsService(client)

    if (request.method === 'GET') {
        return service.getRelationsItemsWithExternalID(request.query);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function delete_relations(client: Client, request: Request) {
    const service = new RelatedItemsService(client)

    if (request.method === 'POST') {
        return service.deleteRelations(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function add_items_to_relation_with_externalid(client: Client, request: Request) {
    const service = new RelatedItemsService(client)

    if (request.method === 'POST') {
        return service.addItemsToRelationWithExternalID(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function remove_items_from_relation_with_externalid(client: Client, request: Request) {
    const service = new RelatedItemsService(client)

    if (request.method === 'POST') {
        return service.removeItemsFromRelationWithExternalID(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

//Items endpoints

export async function get_items(client: Client, request: Request) {
    const service = new RelatedItemsService(client)

    if (request.method === 'GET') {
        return service.getItems(request.query);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

// ATD functions

export async function atd_fields(client: Client, request: Request) {
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

export async function delete_atd_fields(client: Client, request: Request) {
    const service = new RelatedItemsService(client)

    if (request.method === 'POST') {
        return service.deleteAtdFields(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function create_tsa_field(client: Client, request:Request) {
    const service = new RelatedItemsService(client)

    if (request.method == 'POST') {
        return service.createAtdTransactionLinesFields(request.body);
    }
    else if (request.method == 'GET') {
        throw new Error(`Method ${request.method} not supported`);       
    }
}