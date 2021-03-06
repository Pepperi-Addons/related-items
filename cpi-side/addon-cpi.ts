import '@pepperi-addons/cpi-node'
import { Item, TransactionLine, UIObject } from '@pepperi-addons/cpi-node/build/cpi-side/app/entities';
import { ListSourceType } from '../shared/entities';
import config from "../addon.config.json"

export async function load() {
    let fieldsFromADAL = await pepperi.api.adal.getList({
        addon: config.AddonUUID,
        table: 'AtdFields'
    });

    const manager = new RelatedItemsCPIManager(fieldsFromADAL);
    manager.load();
}

class RelatedItemsCPIManager {

    constructor(private fieldsFromADAL) {
    }

    load() {
        this.subscribe()
    }

    subscribe() {
        // subscribe to Order center items details
        pepperi.events.intercept("RecalculateUIObject", {
            UIObject: {
                context: {
                    Name: "OrderCenterItemDetails"
                }
            }
        },
            async (data) => {
                if (data.UIObject) {
                    await this.handleRelatedObjectFields(data.UIObject);
                }
            });
    }

    async handleRelatedObjectFields(data: UIObject) {
        let fields = data.fields;
        let transactionLine = data.dataObject as TransactionLine;
        let typeID = transactionLine.typeDefinition?.internalID;
        let currentItemID = transactionLine.item.uuid;
        let transaction = transactionLine.transaction;
        let transactionScope = transaction.transactionScope
        for (const field of fields) {
            if (field.type == 'RelatedObjectsCards') {
                //get the specific field of the current transaction type if exists
                const fieldFromADAL = this.fieldsFromADAL.objects.find(innerField => innerField.FieldID == field.fieldID && innerField.TypeID == typeID);
                if (fieldFromADAL) {
                    const items = await this.getListOfRelatedItems(data, fieldFromADAL, currentItemID);
                    const tsItems = (await Promise.all(items.map(item => transactionScope?.getLine(item)))).filter(Boolean) as TransactionLine[];
                    if (tsItems.length > 0) {
                        await this.createGenericList(tsItems, field, typeID)
                    }
                }
            }
        }
    }

    async getListOfRelatedItems(data, fieldFromADAL, currentItemID) {
        let listType = fieldFromADAL?.ListType;
        let listSource = fieldFromADAL?.ListSource;
        let relatedItems: string[] | undefined

        if (listType == ListSourceType.RelatedCollectionType) {
            let key = `${listSource}_${currentItemID}`
            try {
                let item = await pepperi.api.adal.get({
                    addon: config.AddonUUID,
                    table: 'CPIRelation',
                    key: key
                });
    
                relatedItems = item.object.RelatedItems;
            }
            catch {
                relatedItems = [];
                console.log('Item not found')
            }

        }
        else {
            try {
                let fieldValue = await data.dataObject?.getFieldValue(listSource);
                relatedItems = JSON.parse(fieldValue)
            }
            catch (err) {
                console.log('GetListOfItems failed with error:', err)
            }

        }
        relatedItems = relatedItems ? relatedItems : [];
        return (await (await Promise.all(relatedItems.map(item => pepperi.DataObject.Get("items", item)))).filter(item => !!item) as Item[]);
    }

    async createGenericList(tsItems, field, typeID) {
        let uiPage = await pepperi.UIPage.CreateGenericListPage({
            Name: 'OrderCenterView2',
            Object: {
                Resource: 'transactions',
                InternalID: typeID,
            },
            Profile: {
                InternalID: 0            
            },
            ScreenSize: 'Tablet'
         }, tsItems)
        
        await uiPage?.rebuild();
        const uiPageKey = uiPage?.key || '';
        field.value = uiPageKey;
    }
}