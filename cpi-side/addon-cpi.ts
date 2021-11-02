import '@pepperi-addons/cpi-node'
import { Item, TransactionLine, UIObject } from '@pepperi-addons/cpi-node/build/cpi-side/app/entities';
import config from "../addon.config.json"

interface relatedObjectField {
    ExternalID: string,
    RelatedItems: string []
}

export async function load() {
    console.log('Related Items cpi side works!!!');

    // pepperi.events.intercept("RecalculateUIObject", {
    //     UIObject: {
    //         context: {
    //             Name: "UserHomePage"
    //         }
    //     }
    // }, async(data)=>{
    //     data.UIObject?.fields.forEach(field => field.visible = Math.random()<0.5);
    //     console.log("user homepage")
    // });

    // const list = await pepperi.api.adal.getList({
    //     addon: config.AddonUUID,
    //     table: 'AtdFields'
    // });

           pepperi.events.intercept("RecalculateUIObject", {
        UIObject: {
            context: {
                Name: "OrderCenterItemDetails"
            }
        }
    },
    async(data)=>{
        if (data.UIObject) {
            await getListOfRelatedItems(data.UIObject);
        }
        
    })
}

async function getListOfRelatedItems(data: UIObject) {
    let fieldsFromADAL = await pepperi.api.adal.getList({
        addon: config.AddonUUID,
        table: 'AtdFields'
    });

    let fields = data.fields
    let transactionLine = data.dataObject as TransactionLine
    let internalID = transactionLine.typeDefinition?.internalID;
    let currentItemID = transactionLine.item.uuid;
    let transaction = transactionLine.transaction;
    let transactionScope = await pepperi.TransactionScope.Get(transaction);
    for (const field of fields) {
        if (field.type == 'RelatedObjectsCards') {
            const fieldFromADAL = fieldsFromADAL.objects.find(innerField => innerField.FieldID == field.fieldID && innerField.TypeID == internalID);
            if (fieldFromADAL) {
                const itemsUUIDs = await getListOfItemsUUIDs(data,fieldFromADAL, currentItemID);
                const items: Item[] = (await (await Promise.all(itemsUUIDs.map(item => pepperi.DataObject.Get("items", item)))).filter(item => !!item) as Item[]);
                console.log("ITEMS",items);  
            }
        }
    }

    //step 2: find related item fields(inside interseptor) - V
    //step3: UIObject.dataobject.typeDefinition.internalID , fieldID - V 
    //step4: get list of items uuid for this item (TSA or collection managment)getFieldValue
    //step5: convert to list of items(pepperi.dataObject.get("items", itemUUID))
    //step6: create generic-list
}

    async function getListOfItemsUUIDs(data,fieldFromADAL, currentItemID) {
        let listType = fieldFromADAL?.ListType;
        let listSource = fieldFromADAL?.ListSource;
        let relatedItems: string[] | undefined 

        if (listType == listSourceType.RelatedCollectionType) {
            let key = `${listSource}_${currentItemID}`
            let relations = await pepperi.api.adal.getList({
                addon: config.AddonUUID,
                table: 'CPIRelation'
            });

            relatedItems = relations.objects.find(item => item.Key == key)?.RelatedItems;
        }
        else {
            let fieldValue: relatedObjectField[] = await data.dataObject?.getFieldValue(listSource);
            relatedItems = fieldValue.find(item => item.ExternalID == currentItemID)?.RelatedItems;
        }
        return relatedItems? relatedItems : []
    }

    enum listSourceType {
        RelatedCollectionType = 1,
        FieldType = 2
      }