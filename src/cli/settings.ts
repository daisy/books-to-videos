import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import * as types from "../types/index.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// merge the customSettings with the preset settings (from the internal set of settings, default is 'default')
// - the customSettings does not need to override every setting
// resolve the full path to the stylesheet
function setupSettings(preset?: string, customSettingsFilename?: string): types.Settings {
    let settings = readSettingsFile(path.join(__dirname, `./settings/settings.json`));
    let stylesheets = [...settings.stylesheets];
    if (preset) {
        let presetSettings = readSettingsFile(path.join(__dirname, `./settings/presets/${preset}/settings.json`));
        settings = { ...settings, ...presetSettings };
        stylesheets.push(...presetSettings.stylesheets);
        settings.stylesheets = [...stylesheets];
    }

    if (customSettingsFilename) {
        let customSettings = readSettingsFile(path.resolve(process.cwd(), customSettingsFilename));
        // merge the settings thus far with the custom settings but preserve the independent stylesheets
        settings = { ...settings, ...customSettings };
        stylesheets.push(...customSettings.stylesheets);
        settings.stylesheets = [...stylesheets];
    }

    return settings;
}
// relative to this file
function readSettingsFile(filename: string): types.Settings {
    let settingsFile = fs.readFileSync(filename);
    let settings: types.Settings = JSON.parse(settingsFile);
    settings.stylesheets = settings.stylesheets.map(stylesheet => path.resolve(path.dirname(filename), stylesheet));
    return settings;
}

export { setupSettings };
