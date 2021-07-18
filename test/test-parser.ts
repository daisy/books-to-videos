import { expect } from 'chai';
import 'mocha';
import * as path from 'path';
import { setupSettings } from '../src/cli/settings.js';
import { parseDaisy202 } from '../src/parser/index.js';

describe('Parser', function () {
    let settings;
    before(function () {
        settings = setupSettings();

    });

    it("Creates an object model for a book", async function () {
        let inputFile = path.join(process.cwd(), './test/resources/book/ncc.html');
        console.log(inputFile);
        let book = await parseDaisy202(inputFile, settings);
        expect(book).to.not.be.empty;
    });
});