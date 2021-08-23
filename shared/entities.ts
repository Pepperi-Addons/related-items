export const COLLECTION_TABLE_NAME = 'Collection';
export const RELATION_TABLE_NAME = 'Relations';

export interface Collection {
    Name: string, 
    Description?: string,
    Count?: string
    Key?: string
    Hidden?: boolean
}

export interface RelationItem {
    CollectionName?: string, 
    ItemUUID?: string,
    RelatedItems?: [string] 
    Key?: string
    Hidden?: boolean
}