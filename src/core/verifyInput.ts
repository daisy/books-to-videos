import fs from 'fs-extra';

function verifyInput(inputFilename): boolean {
    // validate the input filename
    if (inputFilename.toLowerCase().indexOf('ncc.html') != inputFilename.length - 8) {
        throw new Error(`Input must be an NCC file. Got "${inputFilename}" instead.`);
    }
    if (!fs.existsSync(inputFilename)) {
        throw new Error(`Input file not found ${inputFilename}`);
    }
    return true;
}

export { verifyInput };