import { XhtmlEntities } from './xhtml-entities';

function replaceEntities(xmlString): string {

    let str = xmlString;
    for (let namedEntity in XhtmlEntities) {
        let numericEntity = XhtmlEntities[namedEntity];
        const regexp = new RegExp(namedEntity, 'g');
        str = str.replace(regexp, numericEntity);
    }
    return str;
}

export { replaceEntities };