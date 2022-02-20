import { Injectable } from '@angular/core';
import { Collection, RelationItem, IFile, RELATED_ITEM_META_DATA_TABLE_NAME } from '../../../../shared/entities';
import { AddonService } from './addon.service';
import { saveAs } from 'file-saver';
import { DIMXComponent as DIMXComponent } from '@pepperi-addons/ngx-composite-lib/dimx-export';

@Injectable({
    providedIn: 'root'
})

export class RelatedItemsService {
    iFileID = 0;
    iFileArray:IFile[] = [];

    constructor(
        private addonService: AddonService
    ) {

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
        return this.addonService.papiClient.items.find({ fields: ['UUID'], where: `ExternalID like '${externalID}'` });
    }

    // ATD
    async getTypeInternalID(uuid: string) {
        return await this.addonService.papiClient.types.find({
            where: `UUID='${uuid}'`
        }).then((types) => {
            console.log('uuid is' + uuid + 'types is', types);
            return types[0].InternalID

        });
    }

    async getFieldsFromADAL(uuid: string, query?: string) {
        let typeID = await this.getTypeInternalID(uuid)
        let url = `/addons/api/${this.addonService.addonUUID}/api/atd_fields`
        if (query) {
            url = url + query;
        }
        let fields: any[] = await this.addonService.pepGet(encodeURI(url)).toPromise();
        fields = fields.filter(field => field.TypeID == typeID);
        return fields;
    }

    deleteFields(fields, typeID) {
        let obj = {
            typeID: typeID,
            fields: fields
        }
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/delete_atd_fields`, obj).toPromise();
    }
    async createTSAField(obj: { TypeID: number, Name: string, FieldID: string, ListSource: string, ListType: string, Hidden: boolean }) {
        return await this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/create_tsa_field`, obj).toPromise();
    }

    async getFieldsOfItemsAndTransactionLine(typeID): Promise<{ key: number, value: string }[]> {
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

    // DIMX

    async importCollection(fileToImport:string) {
       let importObject = {
            'URI': fileToImport,
            'OverwriteObject': true,
            'Delimiter': ';'
        }
         let url = `/addons/api/${this.addonService.addonUUID}/api/dimx_import_data`
         debugger
         let ans = await this.addonService.pepPost(url, importObject).toPromise();
         return ans;
}

    async exportCollection() {
        const bod = {
          "Format":'csv',
          "IncludeDeleted":false,
          "Where":'',
          "Fields":"CollectionName,ItemExternalID,RelatedItems",
          "Delimiter":''
      }
        const fileName = 'export.csv';
        const iFile:IFile = {
          "key":this.iFileID++,
          "name":fileName,
          "status":"downloading"
        };
        this.iFileArray.push(iFile);
        try{
            var res = await this.addonService.papiClient.post(`/addons/data/export/file/${this.addonService.addonUUID}/${RELATED_ITEM_META_DATA_TABLE_NAME}`, bod);
            const url = await this.pollDIMXExportResult(res['ExecutionUUID'], iFile);
            let blob = await fetch(url.DownloadURL).then(r => r.blob());
            saveAs(blob, fileName);
            iFile.status = "done";
        }
        catch(ex){
            iFile.status= "failed";
            console.log(`buttonClick: ${ex}`);
            throw new Error((ex as {message:string}).message);
        }
      }
    
      async pollDIMXExportResult(pollingURL:string, ifile:IFile){
        console.log(`polling audit with the executionUUID: ${pollingURL}`);
        const delay = ms => new Promise(res => setTimeout(res, ms));
        var seconds = 0;
        const waitingTime = 1000; //in ms
        try{
            while(true){
                var result = await this.addonService.papiClient.get(`/audit_logs/${pollingURL}`);
                console.log(`result from auditlog get is: ${result}`);
                if( !result || result["Status"]["ID"] === 2 || result["Status"]["ID"] === 4){
                    console.log(`waited for ${seconds++} seconds`);
                    await delay(waitingTime);
                }
                else{
                    break;
                }
            }
            switch(result["Status"]["ID"]){
                case 0:
                    ifile.status = "failed";
                    throw new Error(result["AuditInfo"]["ErrorMessage"]);
                case 1:
                    console.log(`polling result: ${result["AuditInfo"]["ResultObject"]}`);
                    return JSON.parse(result["AuditInfo"]["ResultObject"]);
                default:
                    ifile.status = "failed";
                    throw new Error(`pollDIMXExportResult: unknown audit log type: ${result["Status"]}`);
            }
        }
        catch(ex){
            console.log(`pollDIMXExportResult: ${ex}`);
            ifile.status = "failed";
            throw new Error((ex as {message:string}).message);
        }
    }
}