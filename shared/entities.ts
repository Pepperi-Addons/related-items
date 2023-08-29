import { Item } from '@pepperi-addons/papi-sdk'
import { ImageObject } from '@pepperi-addons/papi-sdk/dist/entities/base';

export const COLLECTION_TABLE_NAME = 'Collection';
export const RELATED_ITEM_CPI_META_DATA_TABLE_NAME = 'CPIRelation';
export const RELATED_ITEM_META_DATA_TABLE_NAME = 'related_items';
export const RELATED_ITEM_ATD_FIELDS_TABLE_NAME = 'AtdFields';
export const PFS_TABLE_NAME = 'IntegrationTestPFSTable';
export const TEMPORARY_MIGRATION_SCHEME = 'temporary_migration_scheme';

export type fileStatus = 'uploading'|'downloading'|'done'|'failed'|'hidden';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export enum ListSourceType {
    RelatedCollectionType = 1,
    FieldType = 2
}

export interface Collection {
    Name: string,
    Description?: string,
    Count?: string,
    Key?: string,
    Hidden?: boolean
}

export interface ItemRelations {
    CollectionName?: string,
    ItemUUID?: string,
    ItemExternalID?: string,
    RelatedItems?: string[],
    Key?: string,
    Hidden?: boolean
}

export type ItemWithImageURL = Item & {
    Name?: string;
    LongDescription?: string;
    ExternalID: string;
    Image?: ImageObject;
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

export class exportAnswer {
    success: boolean;
    DataForImport: any;

    constructor(success: boolean, obj: any) {
        this.success = success;
        this.DataForImport = obj;
    }
}

export class IFile {
    key = 0;
    name = '';
    status: fileStatus = 'downloading';
}

export interface itemsResourceObject {
    ExternalID: string;
    MainCategoryID: number;
    Key: string;
}

export interface ItemRelationValidate {
    relationItem: ItemRelations;
    success: boolean;
    message: string | undefined;
}

