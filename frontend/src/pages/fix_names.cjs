const fs = require('fs');
const path = require('path');

const fixTerminology = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // UI replacements
    content = content.replace(/>Material Receiving List</g, '>Project Tool Site List<');
    content = content.replace(/>Material Receiving Lists</g, '>Project Tool Site Lists<');
    content = content.replace(/Material Receiving \(/g, 'Project Tool Site (');
    content = content.replace(/>\+ Add Form</g, '>+ Add Form<'); // already ok
    content = content.replace(/No material receiving forms found/g, 'No project tool site forms found');
    content = content.replace(/view the material receiving lists/g, 'view the project tool site lists');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${path.basename(filePath)}`);
};

fixTerminology(path.join(__dirname, 'ProjectDocumentsPage.tsx'));
fixTerminology(path.join(__dirname, 'ProjectDetailsPage.tsx'));
