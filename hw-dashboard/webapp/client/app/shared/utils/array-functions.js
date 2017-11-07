/**
 * Delete properties from existingObjReference which are not present in newObj
 *
 * @param existingObjReference
 * @param newObjKeysAsArray {Array}
 */
export function deleteNonExistingKeysFromOldObject(existingObjReference, newObjKeysAsArray) {
    var deleteArr = Object.keys(existingObjReference).filter(function (existingPropertyKey) {
        return !newObjKeysAsArray.some(function (newPropertyKey) {
            return newPropertyKey == existingPropertyKey;
        })
    });
    deleteArr.forEach(function (propertyKey) {
        delete existingObjReference[propertyKey];
    });
}
