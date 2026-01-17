const { app, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(() => {
    const iconPath = path.join(__dirname, '../assets/icons/icon.png');
    const fixedPath = path.join(__dirname, '../assets/icons/icon_fixed.png');

    console.log('Reading:', iconPath);
    const img = nativeImage.createFromPath(iconPath);

    // nativeImage can read JPEG if the extension is wrong? Yes, usually.
    // If not, we might need to trick it or just copy 'tray-icon.png' manually.
    // Let's assume nativeImage is smart enough (it usually is).

    if (!img.isEmpty()) {
        const pngBuffer = img.toPNG();
        fs.writeFileSync(fixedPath, pngBuffer);
        console.log('Success: Created icon_fixed.png');
    } else {
        console.error('Failed: Image is empty');
    }
    app.quit();
});
