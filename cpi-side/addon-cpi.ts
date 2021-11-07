import '@pepperi-addons/cpi-node'
import { Item, TransactionLine, UIObject } from '@pepperi-addons/cpi-node/build/cpi-side/app/entities';
import config from "../addon.config.json"

enum listSourceType {
    RelatedCollectionType = 1,
    FieldType = 2
}

export async function load() {
    let fieldsFromADAL = await pepperi.api.adal.getList({
        addon: config.AddonUUID,
        table: 'AtdFields'
    });

    let relationsTable = await pepperi.api.adal.getList({
        addon: config.AddonUUID,
        table: 'CPIRelation'
    });

    const manager = new RelatedItemsCPIManager(fieldsFromADAL, relationsTable);
    manager.load();
}

class RelatedItemsCPIManager {

    constructor(private fieldsFromADAL, private relationsTable) {
        this.fieldsFromADAL = fieldsFromADAL;
        this.relationsTable = relationsTable;
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
                    await this.createRelatedObjectField(data.UIObject);
                }

            })
    }

    async createRelatedObjectField(data: UIObject) {
        let fields = data.fields
        let transactionLine = data.dataObject as TransactionLine
        let typeID = transactionLine.typeDefinition?.internalID;
        let currentItemID = transactionLine.item.uuid;
        let transaction = transactionLine.transaction;
        let transactionScope = await pepperi.TransactionScope.Get(transaction);
        for (const field of fields) {
            if (field.type == 'RelatedObjectsCards') {
                const fieldFromADAL = this.fieldsFromADAL.objects.find(innerField => innerField.FieldID == field.fieldID && innerField.TypeID == typeID);
                if (fieldFromADAL) {
                    const items = await this.getListOfRelatedItems(data, fieldFromADAL, currentItemID);
                    const tsItems = (await Promise.all(items.map(item => transactionScope.getItem(item)))).filter(Boolean) as TransactionLine[];
                    this.createGenericList(tsItems, field, typeID)
                }
            }
        }
    }

    async getListOfRelatedItems(data, fieldFromADAL, currentItemID) {
        let listType = fieldFromADAL?.ListType;
        let listSource = fieldFromADAL?.ListSource;
        let relatedItems: string[] | undefined

        if (listType == listSourceType.RelatedCollectionType) {
            let key = `${listSource}_${currentItemID}`
            relatedItems = this.relationsTable.objects.find(item => item.Key == key)?.RelatedItems;
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
        console.log(uiPageKey);
        field.value = uiPageKey;
        field.formattedValue = uiPageKey;
    }
}