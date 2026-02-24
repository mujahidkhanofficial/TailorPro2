const fs = require('fs');

const inputFile = 'public/logo.png';
const outputFile = 'public/icon.ico';

try {
    const pngData = fs.readFileSync(inputFile);

    // Check if valid PNG
    if (pngData.readUInt32BE(0) !== 0x89504E47) {
        throw new Error('Not a valid PNG file');
    }

    // Basic ICO Header (6 bytes)
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // Reserved
    header.writeUInt16LE(1, 2); // Type (1 = ICO)
    header.writeUInt16LE(1, 4); // Count (1 image)

    // Directory Entry (16 bytes)
    const entry = Buffer.alloc(16);

    // We'll write 0 for width/height (256px or larger)
    entry.writeUInt8(0, 0); // Width
    entry.writeUInt8(0, 1); // Height
    entry.writeUInt8(0, 2); // Colors
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Planes
    entry.writeUInt16LE(32, 6); // BPP
    entry.writeUInt32LE(pngData.length, 8); // Size
    entry.writeUInt32LE(6 + 16, 12); // Offset (Header + Directory)

    const icoData = Buffer.concat([header, entry, pngData]);

    fs.writeFileSync(outputFile, icoData);
    console.log(`Success: Created ${outputFile} (${icoData.length} bytes)`);

} catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
}
