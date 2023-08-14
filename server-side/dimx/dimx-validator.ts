import { DIMXObject, SearchBody, SearchData } from '@pepperi-addons/papi-sdk'
import { PapiClient, AddonData } from '@pepperi-addons/papi-sdk'
import { Collection, ItemRelations } from 'shared'
import { RelatedItemsValidator } from '../related-items-validator';
import RelatedItemsService from '../related-items.service';
import { ItemRelationValidate } from 'shared/entities';

export class DimxValidator {
    maxNumOfRelatedItems = 25;
    maxChunkSize = 500;
    existingItemsMap: Map<string, Boolean> = new Map<string, Boolean>();

    constructor(private papiClient: PapiClient, private relatedItemsService: RelatedItemsService, private dimxObjects) {
    }

    async handleDimxObjItem(): Promise<DIMXObject[]> {
        // get the dimxobject and return object that meets the restriction :
        // * the main item and all the related items are exist
        // * no more than 25 related items
        // * not pointing to itself 
        const itemsRelations: ItemRelations[] = this.dimxObjects.map(dimxObj => dimxObj.Object);
        const relatedItemsValidator = new RelatedItemsValidator(this.papiClient, this.relatedItemsService, itemsRelations);

        await relatedItemsValidator.loadData();
        await this.dimxObjects.map(async obj => {
            const valid: ItemRelationValidate = await relatedItemsValidator.validate(obj.Object);
            const dimxObj = {
                Object: valid.relationItem,
                OverwriteObject: true
            }
            if (!valid.success) {
                this.markItemAsError(dimxObj, valid.message!);
            }
            
            return dimxObj
        });
        return this.dimxObjects;
    }

    private markItemAsError(dimxObj, errorMsg: string) {
        dimxObj.Status = 'Error';
        dimxObj.Details = errorMsg;
    }
}