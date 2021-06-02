import winston from 'winston';
import fs from 'fs-extra';
import path from 'path';
import { DOMParser, XMLSerializer } from 'xmldom';
import xpath from 'xpath';
import * as types from '../../types';
import * as utils from '../../utils';
import iconv from 'iconv-lite';

// TODO this processes the SMIL file as a flat list of pars, more or less
// how will this affect files with deeper SMIL structure, e.g. footnotes etc? 
// TODO more sophisticated timestamp parsing
async function parse(filename:string, options:types.Settings): Promise<Array<types.MediaSegment>> {
    winston.verbose(`Parsing SMIL file ${filename}`);
    
    let encoding = options.encoding ?? utils.sniffEncoding(filename);
    let fileContents = await fs.readFile(filename);
    fileContents = iconv.decode(fileContents, encoding);
    
    let doc = new DOMParser().parseFromString(fileContents);
    
    let parElms = Array.from(doc.getElementsByTagName("par"));
    let smilData:Array<types.MediaSegment> = [];
    for (let parElm of parElms) {
        let textElm = parElm.getElementsByTagName("text");
        if (textElm.length > 0) {
            // @ts-ignore
            textElm = textElm[0];
        }
        let audioElms = Array.from(parElm.getElementsByTagName("audio"));
        
        let {src: htmlSrc, selector: htmlSelector} = 
            // @ts-ignore
            utils.splitSrcSelector(path.resolve(path.dirname(filename), textElm.getAttribute("src")));
        
        // keep track of any IDs that could be used to refer to this <par>
        let xmlIds = collectIds(parElm); 
        // express the IDs as filepath#ID
        xmlIds = xmlIds.map(xmlId => `${filename}#${xmlId}`);

        let segment:types.MediaSegment = {
            ids: xmlIds,
            html: {
                src: htmlSrc,
                selector: htmlSelector
            },
            audios: audioElms.map(audioElm => ({
                src: path.resolve(path.dirname(filename), audioElm.getAttribute("src")),
                clipBegin: parseFloat(audioElm.getAttribute("clip-begin").replace('npt=', '').replace('s', '')),
                clipEnd: parseFloat(audioElm.getAttribute("clip-end").replace('npt=', '').replace('s', ''))
            })),
            isPageNumber: false // default to false
        };
        let durs = segment.audios.map(audio => audio.clipEnd - audio.clipBegin);
        let dur = durs.reduce((acc, curr) => acc += curr, 0);
        segment.dur = dur;
        smilData.push(segment);
    }
    return smilData;
}

// get the IDs from the given element and all its descendents
function collectIds(elm): Array<string> {
    if (elm.nodeType != elm.ELEMENT_NODE) {
        return []
    }
    let ids = [];
    if (elm.hasAttribute("id")) {
        ids.push(elm.getAttribute("id"));
    }
    let childIds = Array.from(elm.childNodes).map(childElm => collectIds(childElm)).flat();
    return ids.concat(childIds);
}

export { parse };