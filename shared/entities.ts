
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