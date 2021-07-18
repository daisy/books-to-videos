import { expect } from 'chai';
import 'mocha';

describe("Does the test framework run?", function () {
    it("can run a test", function () {
        expect("Success!").to.equal("Success!");
    });
});
