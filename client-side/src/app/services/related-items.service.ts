import { Injectable } from '@angular/core';
import { FileSelectDirective } from 'ng2-file-upload';
import { Collection, RelationItem } from '../../../../shared/entities';
import { fieldFormMode } from '../components/field-form/field-form.component';
import { AddonService } from './addon.service';

@Injectable({
    providedIn: 'root'
})

export class RelatedItemsService {

    constructor(
        private addonService: AddonService
    )  {
          
    }

    getCollections(query?: string) {
        let url = `/addons/api/${this.addonService.addonUUID}/api/collections`
        if (query) {
            url = url + query;
        }
        return this.addonService.pepGet(encodeURI(url)).toPromise();
    }

    saveCollection(collection) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/collections`, collection).toPromise();
    }

    deleteCollections(collections: Collection[]) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/delete_collections`, collections).toPromise();
    }

    getRelations(collectionName: string) {
        let url = `/addons/api/${this.addonService.addonUUID}/api/relation?` + `CollectionName=${collectionName}`;
        return this.addonService.pepGet(encodeURI(url)).toPromise();
    }

    deleteRelations(relation: RelationItem[]) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/delete_relations`, relation).toPromise();
    }

    addRelatedItems(relatedItems) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/add_items_to_relation_with_externalid`, relatedItems).toPromise();
    }

    deleteRelatedItems(itemToUpdate) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/remove_items_from_relation_with_externalid`, itemToUpdate).toPromise();
    }

    getItemsInCollection(collectionName: string, relationExternalId: string) {
        let url = `/addons/api/${this.addonService.addonUUID}/api/get_items?` + `CollectionName=${collectionName}&ExternalID=${relationExternalId}`;
        return this.addonService.pepGet(encodeURI(url)).toPromise();
    }

    getItemsWithExternalId(externalID: string) {
        return this.addonService.papiClient.items.find({fields:['UUID'], where: `ExternalID like '${externalID}'` });
    }

    // ATD
    async getTypeInternalID(uuid: string) {
        return  await this.addonService.papiClient.types.find({
            where: `UUID='${uuid}'`
        }).then((types) => {
            console.log('uuid is' + uuid + 'types is', types);
            return types[0].InternalID

        });
    }

    async getFieldsFromADAL(uuid:string,query?: string) {
        let typeID = await this.getTypeInternalID(uuid)
        let url = `/addons/api/${this.addonService.addonUUID}/api/atd_fields`
        if (query) {
            url = url + query;
        }
        let fields: any[] = await this.addonService.pepGet(encodeURI(url)).toPromise();
        fields = fields.filter(field => field.TypeID === typeID);
        return fields;
    }

    deleteFields(fields, typeID) {
        let obj = {
            typeID: typeID,
            fields: fields
        }
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/delete_atd_fields`, obj).toPromise();
    }
    async createTSAField(obj: {TypeID:number, Name:string, FieldID:string, ListSource:string[], ListType:string, Hidden: boolean}) {
        return await this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/create_tsa_field`, obj).toPromise();
    }

    async getTSASpecificField(fieldID){
        let url = `/meta_data/transaction_lines/fields/${fieldID}`;
        let fields = undefined;
        try{
            fields = await this.addonService.pepGet(encodeURI(url)).toPromise();
        }
        catch(e) {
        }
        finally {
            return fields;
        }
    }

    async getFieldsOfItemsAndTransactionLine(typeID): Promise<{key:number, value:string}[]> {
        let fieldsForTransactonLines = await this.addonService.papiClient.get(`/meta_data/transaction_lines/types/${typeID}/fields`);

        fieldsForTransactonLines = fieldsForTransactonLines.filter(field => field.Type === "String")
        let fieldsForItems = await this.addonService.papiClient.get(`/meta_data/items/fields`).then(objs => objs.filter(obj => obj.Type === "String"));
        fieldsForItems = fieldsForItems.filter(field => field.Type === "String")

        let stringFields = fieldsForTransactonLines.concat(fieldsForItems);

         //types.concat(fieldsForItems);
        return stringFields.map(item => {
            return {
                value: item.FieldID,
                key: item.FieldID
            }
        })
    }
}