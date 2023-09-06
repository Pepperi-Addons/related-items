import { BaseSchemeTrasferDataDelegete } from './scheme-build-operation';

// this class is used to the transition from related_items scheme to temporary scheme
// override fixObject - need to change the keys of itemsRelations to be without white spaces
export class RemoveWhiteSpacesBuildOperaton extends BaseSchemeTrasferDataDelegete {

    // replece white spaces with underscore
    fixObjects(objects) {
        objects.map(obj => {
            obj.Key = obj.Key!.replace(/\s/g, '_');
            return obj;
        });
        return objects;
    }
}
