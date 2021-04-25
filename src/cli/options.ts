import * as types from "../types";
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_OPTIONS_FILENAME = './defaults/default.json';

// merge the customoptions with the default options
// - the customoptions does not need to override every setting
// resolve the full path to the stylesheet
function setupOptions(customOptionsFilename?: string): types.Options {
    let optionsFilename = path.join(__dirname, DEFAULT_OPTIONS_FILENAME);
    let optionsFile = fs.readFileSync(optionsFilename);
    let options: types.Options = JSON.parse(optionsFile);
    options.stylesheet = path.resolve(path.dirname(optionsFilename), options.stylesheet);
    
    if (customOptionsFilename) {
        optionsFilename = path.resolve(process.cwd(), customOptionsFilename);
        let customoptionsFile = fs.readFileSync(optionsFilename);
        let customoptions: types.Options = JSON.parse(customoptionsFile);
        // if the custom options overrides specifies a stylesheet, 
        // then resolve that stylesheet against the path for the custom options file
        if (customoptions.stylesheet) {
            customoptions.stylesheet = path.resolve(path.dirname(optionsFilename), customoptions.stylesheet);
        }
        // merge custom options with defaults
        options = { ...options, ...customoptions };
    }
    
    return options;
}

export { setupOptions }