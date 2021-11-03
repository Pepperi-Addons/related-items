"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.load = void 0;
require("@pepperi-addons/cpi-node");
const addon_config_json_1 = __importDefault(require("../addon.config.json"));
var listSourceType;
(function (listSourceType) {
    listSourceType[listSourceType["RelatedCollectionType"] = 1] = "RelatedCollectionType";
    listSourceType[listSourceType["FieldType"] = 2] = "FieldType";
})(listSourceType || (listSourceType = {}));
async function load() {
    let fieldsFromADAL = await pepperi.api.adal.getList({
        addon: addon_config_json_1.default.AddonUUID,
        table: 'AtdFields'
    });
    let relationsTable = await pepperi.api.adal.getList({
        addon: addon_config_json_1.default.AddonUUID,
        table: 'CPIRelation'
    });
    const manager = new RelatedItemsCPIManager(fieldsFromADAL, relationsTable);
    manager.load();
}
exports.load = load;
class RelatedItemsCPIManager {
    constructor(fieldsFromADAL, relationsTable) {
        this.fieldsFromADAL = fieldsFromADAL;
        this.relationsTable = relationsTable;
        this.fieldsFromADAL = fieldsFromADAL;
        this.relationsTable = relationsTable;
    }
    load() {
        this.subscribe();
    }
    subscribe() {
        // subscribe to Order center items details
        pepperi.events.intercept("RecalculateUIObject", {
            UIObject: {
                context: {
                    Name: "OrderCenterItemDetails"
                }
            }
        }, async (data) => {
            if (data.UIObject) {
                await this.createRelatedObjectField(data.UIObject, this.fieldsFromADAL, this.relationsTable);
            }
        });
    }
    async createRelatedObjectField(data, fieldsFromADAL, relationsTable) {
        var _a;
        let fields = data.fields;
        let transactionLine = data.dataObject;
        let typeID = (_a = transactionLine.typeDefinition) === null || _a === void 0 ? void 0 : _a.internalID;
        let currentItemID = transactionLine.item.uuid;
        let transaction = transactionLine.transaction;
        let transactionScope = await pepperi.TransactionScope.Get(transaction);
        for (const field of fields) {
            if (field.type == 'RelatedObjectsCards') {
                const fieldFromADAL = fieldsFromADAL.objects.find(innerField => innerField.FieldID == field.fieldID && innerField.TypeID == typeID);
                if (fieldFromADAL) {
                    const items = await this.getListOfRelatedItems(data, fieldFromADAL, currentItemID, relationsTable);
                    const tsItems = (await Promise.all(items.map(item => transactionScope.getItem(item)))).filter(Boolean);
                    this.createGenericList(tsItems, field, typeID);
                }
            }
        }
    }
    async getListOfRelatedItems(data, fieldFromADAL, currentItemID, relationsTable) {
        var _a, _b;
        let listType = fieldFromADAL === null || fieldFromADAL === void 0 ? void 0 : fieldFromADAL.ListType;
        let listSource = fieldFromADAL === null || fieldFromADAL === void 0 ? void 0 : fieldFromADAL.ListSource;
        let relatedItems;
        if (listType == listSourceType.RelatedCollectionType) {
            let key = `${listSource}_${currentItemID}`;
            relatedItems = (_a = relationsTable.objects.find(item => item.Key == key)) === null || _a === void 0 ? void 0 : _a.RelatedItems;
        }
        else {
            try {
                let fieldValue = await ((_b = data.dataObject) === null || _b === void 0 ? void 0 : _b.getFieldValue(listSource));
                relatedItems = JSON.parse(fieldValue);
            }
            catch (err) {
                console.log('GetListOfItems failed with error:', err);
            }
        }
        relatedItems = relatedItems ? relatedItems : [];
        return await (await Promise.all(relatedItems.map(item => pepperi.DataObject.Get("items", item)))).filter(item => !!item);
    }
    async createGenericList(tsItems, field, typeID) {
        pepperi.UIPage.CreateGenericListPage({
            Name: 'OrderCenterView2',
            Object: {
                Resource: 'transactions',
                InternalID: typeID,
            },
            Profile: {
                InternalID: 0
            },
            ScreenSize: 'Tablet'
        }, tsItems).then((uiPage) => {
            // uiPage?.rebuild().then(() => {
            const uiPageKey = (uiPage === null || uiPage === void 0 ? void 0 : uiPage.key) || '';
            console.log(uiPageKey);
            field.value = uiPageKey;
            field.formattedValue = uiPageKey;
            // })
        });
        // await 
        // const uiPageKey = uiPage?.key || '';
        // console.log(uiPageKey);
        // field.value = uiPageKey;
        // field.formattedValue = uiPageKey;
    }
}
//# sourceMappingURL=addon-cpi.js.map