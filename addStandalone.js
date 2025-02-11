const fs = require('fs');
const path = require('path');

// Fungsi untuk menambahkan `standalone: true` di setiap komponen
function addStandaloneToComponents(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      addStandaloneToComponents(filePath);
    } else if (file.endsWith('.component.ts')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      if (!content.includes('standalone: true')) {
        content = content.replace('@Component({', '@Component({\n  standalone: true,');
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Added standalone to ${filePath}`);
      }
    }
  });
}

// Mulai dari direktori src/app
addStandaloneToComponents('./src/app');
