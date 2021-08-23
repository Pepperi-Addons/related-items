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
};

export async function delete_collections(client: Client, request: Request) {
    const service = new RelatedItemsService(client)

    if (request.method === 'POST') {
        return service.deleteCollections(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
        }

}


// Relation table endpoints

export async function relation(client: Client, request: Request) {
    const service = new RelatedItemsService(client)

    if (request.method === 'GET') {
        return service.getRelationsItems(request.query);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
        }
};

export async function add_items_to_relation(client: Client, request: Request) {
    const service = new RelatedItemsService(client)

    if (request.method === 'POST') {
        return service.addItemsToRelation(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
        }
}

export async function remove_items_from_relation(client: Client, request: Request) {
    const service = new RelatedItemsService(client)

    if (request.method === 'POST') {
        return service.removeItemsFromRelation(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}