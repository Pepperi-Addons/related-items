import { DIMXObject, PapiClient } from '@pepperi-addons/papi-sdk'
import RelatedItemsService from '../related-items.service';
import { ItemRelations } from 'shared'
import { RelatedItemsValidator } from '../related-items-validator';
import { ItemRelationValidate } from 'shared/entities';

export class DimxValidator {
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
        this.dimxObjects.map(obj => {
            const valid: ItemRelationValidate = relatedItemsValidator.validate(obj.Object);
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
