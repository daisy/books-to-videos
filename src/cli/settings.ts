
import * as types from "../types";
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// merge the customSettings with the preset settings (from the internal set of settings, default is 'default')
// - the customSettings does not need to override every setting
// resolve the full path to the stylesheet
function setupSettings(preset: string, customSettingsFilename?: string): types.Settings {
    let settingsFilename = path.join(__dirname, `./presets/${preset}/settings.json`);
    let settingsFile = fs.readFileSync(settingsFilename);
    let settings: types.Settings = JSON.parse(settingsFile);
    settings.stylesheet = path.resolve(path.dirname(settingsFilename), settings.stylesheet);
    
    if (customSettingsFilename) {
        settingsFilename = path.resolve(process.cwd(), customSettingsFilename);
        
        let customSettingsFile = fs.readFileSync(settingsFilename);
        let customSettings: types.Settings = JSON.parse(customSettingsFile);
        // if the custom settings overrides specifies a stylesheet, 
        // then resolve that stylesheet against the path for the custom settings file
        if (customSettings.stylesheet) {
            customSettings.stylesheet = path.resolve(path.dirname(settingsFilename), customSettings.stylesheet);
        }
        // merge custom settings with defaults
        settings = { ...settings, ...customSettings };
    }
    
    return settings;
}

export { setupSettings }