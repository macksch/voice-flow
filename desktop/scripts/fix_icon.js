const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const input = path.join(__dirname, '../assets/icons/icon.png');
const output = path.join(__dirname, '../assets/icons/icon.ico');

console.log('Converting:', input);

sharp(input)
    .resize(256, 256)
    .png()
    .toBuffer()
    .then(pngBuffer => {
        console.log('PNG buffer created, size:', pngBuffer.length);

        // Create ICO manually
        // ICO format: Header (6 bytes) + Image Entry (16 bytes) + PNG data
        const iconDir = Buffer.alloc(6);
        iconDir.writeUInt16LE(0, 0);       // Reserved (must be 0)
        iconDir.writeUInt16LE(1, 2);       // Image type (1 = ICO)
        iconDir.writeUInt16LE(1, 4);       // Number of images

        const iconEntry = Buffer.alloc(16);
        iconEntry.writeUInt8(0, 0);        // Width (0 = 256)
        iconEntry.writeUInt8(0, 1);        // Height (0 = 256)
        iconEntry.writeUInt8(0, 2);        // Color palette
        iconEntry.writeUInt8(0, 3);        // Reserved
        iconEntry.writeUInt16LE(1, 4);     // Color planes
        iconEntry.writeUInt16LE(32, 6);    // Bits per pixel
        iconEntry.writeUInt32LE(pngBuffer.length, 8);  // Image size
        iconEntry.writeUInt32LE(22, 12);   // Offset (6 + 16 = 22)

        const icoBuffer = Buffer.concat([iconDir, iconEntry, pngBuffer]);
        fs.writeFileSync(output, icoBuffer);

        console.log('SUCCESS! Created valid ICO at:', output);
        console.log('ICO size:', icoBuffer.length, 'bytes');
        console.log('ICO header (first 6 bytes):', icoBuffer.slice(0, 6));
    })
    .catch(err => {
        console.error('ERROR:', err);
        process.exit(1);
    });
