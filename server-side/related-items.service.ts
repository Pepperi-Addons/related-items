import { PapiClient, InstalledAddon } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { v4 as uuid } from 'uuid';
import {Collection} from '../shared/entities'
import {RelationItem} from '../shared/entities'

const COLLECTION_TABLE_NAME = 'Collection';
const RELATION_TABLE_NAME = 'Relations';

class RelatedItemsService {

    papiClient: PapiClient
    addonUUID: string;

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client["ActionUUID"]
        });

        this.addonUUID = client.AddonUUID; 
    }

    //Collection table functions
    async getCollections(body) {
        let collectionArray = await this.papiClient.addons.data.uuid(this.addonUUID).table(COLLECTION_TABLE_NAME).find(body)

        for (const collection of collectionArray) {
            const relationsArray = await this.getRelationsItems({'collection': collection.Name});
            collection.Count = relationsArray.length;
          }

       return collectionArray;
    }

    upsertRelatedCollection(body: Collection) {
        if(body.Name) {
            body.Key = body.Name;
            return this.papiClient.addons.data.uuid(this.addonUUID).table(COLLECTION_TABLE_NAME).upsert(body);
        }
        else {
            throw new Error(`Name is required`);  
        }
    }

    //Relations table functions
    getRelationsItems(body: {collection: string,item?: string}) {
        if(!body.collection){
            throw new Error(`collection is required`);  
        }
        if(!body.item){
            return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATION_TABLE_NAME).find({where: `Key like '${body.collection}_%'`});
        }
        else{
            let key = `${body.collection}_${body.item}`;
            return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATION_TABLE_NAME).find({where: `Key like '${key}%'`});
        }
    }

    async addItemsToRelation(body: RelationItem) {
        //validate that the required fields exist
        if(body.CollectionName && body.ItemUUID) {
            body.Key = `${body.CollectionName}_${body.ItemUUID}`;

            // if the RealationItem exists - adds new Relateditems to the item's relatedItems array, else creates new RealationItem
            let item = await this.getRelationsItems({collection: body.CollectionName, item: body.ItemUUID});
            if (item && item.length > 0) {
                if (item[0].RelatedItems) {
                    item[0].RelatedItems = item[0].RelatedItems.concat(body.RelatedItems);
                }
                else {
                    item[0].RelatedItems = body.RelatedItems;
                }
                return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATION_TABLE_NAME).upsert(item[0])
            }
            else {
                return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATION_TABLE_NAME).upsert(body)
            }
        }
        else {
            throw new Error(`CollectionName and ItemUUID are required`);  
        }
    }

    async removeItemsFromRelation(body:RelationItem) {
        let itemsToRemove = body.RelatedItems;
        if (itemsToRemove) {
            if(body.CollectionName && body.ItemUUID) {
                let item = await this.getRelationsItems({collection: body.CollectionName, item: body.ItemUUID});
                if (item && item.length > 0) {
                    item[0].RelatedItems = await this.deleteItemsFromGivenArray(itemsToRemove, item[0].RelatedItems);

                    return this.papiClient.addons.data.uuid(this.addonUUID).table(RELATION_TABLE_NAME).upsert(item[0]);
                }
                else {
                    throw new Error(`Relation does not exist`);
                }
            }
            else {
                throw new Error(`CollectionName and ItemUUID is required`);
            }
        } 
    }

     deleteItemsFromGivenArray(itemsToRemove, array) {
        for(const item of itemsToRemove) {
            const index = array.indexOf(item, 0);
            if (index > -1) {
                array.splice(index, 1);
            }
        }
        return array;
    }
}

export default RelatedItemsService;