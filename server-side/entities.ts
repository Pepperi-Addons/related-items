import { Item } from '@pepperi-addons/papi-sdk'

export const COLLECTION_TABLE_NAME = 'Collection';
export const RELATED_ITEM_CPI_META_DATA_TABLE_NAME = 'CPIRelation';
export const RELATED_ITEM_META_DATA_TABLE_NAME = 'RelationsWithExternalID';
export const RELATED_ITEM_ATD_FIELDS_TABLE_NAME = 'AtdFields';

export interface Collection {
    Name: string,
    Description?: string,
    Count?: string,
    Key?: string,
    Hidden?: boolean
}

export interface RelationItem {
    CollectionName?: string,
    ItemUUID?: string,
    RelatedItems?: string[],
    Key?: string,
    Hidden?: boolean
}

export interface RelationItemWithExternalID {
    CollectionName?: string,
    ItemUUID?: string,
    ItemExternalID?: string,
    RelatedItems?: string[],
    Key?: string
    Hidden?: boolean
}
export type ItemWithImageURL = Item & {
    ImageURL?: string;
}

export interface Relation {
    RelationName: string;
    AddonUUID: string;
    Name: string;
    Description: string;
    Type: "AddonAPI" | "NgComponent" | "Navigation";
    [key: string]: string;
}

