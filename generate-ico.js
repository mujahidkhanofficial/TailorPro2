const fs = require('fs');
const pngToIco = require('png-to-ico');

console.log('Generating icon.ico from logo.png...');

try {
    pngToIco('public/logo.png')
        .then(buf => {
            fs.writeFileSync('public/icon.ico', buf);
            fs.writeFileSync('gen_log.txt', 'Success: Generated icon.ico');
            console.log('Successfully generated public/icon.ico');
        })
        .catch(err => {
            const msg = 'Error generating icon: ' + err.message;
            fs.writeFileSync('gen_log.txt', msg);
            console.error(msg);
            process.exit(1);
        });
} catch (e) {
    fs.writeFileSync('gen_log.txt', 'Crash: ' + e.message);
    console.error('Crash:', e);
}
