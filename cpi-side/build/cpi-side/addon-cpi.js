"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.load = void 0;
require("@pepperi-addons/cpi-node");
const addon_config_json_1 = __importDefault(require("../addon.config.json"));
async function load() {
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
    }, async (data) => {
        if (data.UIObject) {
            await getListOfRelatedItems(data.UIObject);
        }
    });
}
exports.load = load;
async function getListOfRelatedItems(data) {
    var _a;
    let fieldsFromADAL = await pepperi.api.adal.getList({
        addon: addon_config_json_1.default.AddonUUID,
        table: 'AtdFields'
    });
    let fields = data.fields;
    let transactionLine = data.dataObject;
    let internalID = (_a = transactionLine.typeDefinition) === null || _a === void 0 ? void 0 : _a.internalID;
    let currentItemID = transactionLine.item.uuid;
    let transaction = transactionLine.transaction;
    let transactionScope = await pepperi.TransactionScope.Get(transaction);
    for (const field of fields) {
        if (field.type == 'RelatedObjectsCards') {
            const fieldFromADAL = fieldsFromADAL.objects.find(innerField => innerField.FieldID == field.fieldID && innerField.TypeID == internalID);
            if (fieldFromADAL) {
                const itemsUUIDs = await getListOfItemsUUIDs(data, fieldFromADAL, currentItemID);
                const items = await (await Promise.all(itemsUUIDs.map(item => pepperi.DataObject.Get("items", item)))).filter(item => !!item);
                console.log("ITEMS", items);
            }
        }
    }
    //step 2: find related item fields(inside interseptor) - V
    //step3: UIObject.dataobject.typeDefinition.internalID , fieldID - V 
    //step4: get list of items uuid for this item (TSA or collection managment)getFieldValue
    //step5: convert to list of items(pepperi.dataObject.get("items", itemUUID))
    //step6: create generic-list
}
async function getListOfItemsUUIDs(data, fieldFromADAL, currentItemID) {
    var _a, _b, _c;
    let listType = fieldFromADAL === null || fieldFromADAL === void 0 ? void 0 : fieldFromADAL.ListType;
    let listSource = fieldFromADAL === null || fieldFromADAL === void 0 ? void 0 : fieldFromADAL.ListSource;
    let relatedItems;
    if (listType == listSourceType.RelatedCollectionType) {
        let key = `${listSource}_${currentItemID}`;
        let relations = await pepperi.api.adal.getList({
            addon: addon_config_json_1.default.AddonUUID,
            table: 'CPIRelation'
        });
        relatedItems = (_a = relations.objects.find(item => item.Key == key)) === null || _a === void 0 ? void 0 : _a.RelatedItems;
    }
    else {
        let fieldValue = await ((_b = data.dataObject) === null || _b === void 0 ? void 0 : _b.getFieldValue(listSource));
        relatedItems = (_c = fieldValue.find(item => item.ExternalID == currentItemID)) === null || _c === void 0 ? void 0 : _c.RelatedItems;
    }
    return relatedItems ? relatedItems : [];
}
var listSourceType;
(function (listSourceType) {
    listSourceType[listSourceType["RelatedCollectionType"] = 1] = "RelatedCollectionType";
    listSourceType[listSourceType["FieldType"] = 2] = "FieldType";
})(listSourceType || (listSourceType = {}));
//# sourceMappingURL=addon-cpi.js.map