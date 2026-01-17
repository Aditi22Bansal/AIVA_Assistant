
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

try {
    const pdfParse = require('pdf-parse');
    console.log('Require pdf-parse result:', pdfParse);
    console.log('Type of pdfParse:', typeof pdfParse);
    console.log('pdfParse keys:', Object.keys(pdfParse));

    // Check if it's a function directly
    if (typeof pdfParse === 'function') {
        console.log('pdfParse IS a function');
    } else {
        console.log('pdfParse IS NOT a function');
    }

    // Check default export if it exists
    if (pdfParse.default) {
        console.log('pdfParse.default type:', typeof pdfParse.default);
    }

    import('pdf-parse').then(module => {
        console.log('Import pdf-parse result:', module);
        console.log('Import default:', module.default);
    }).catch(err => {
        console.log('Import failed:', err.message);
    });

} catch (error) {
    console.error('Error requiring pdf-parse:', error);
}
