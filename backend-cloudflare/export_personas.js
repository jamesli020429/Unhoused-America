import { execSync } from 'child_process';
import fs from 'fs';

try {
    console.log("Fetching personas from remote D1 database...");
    const output = execSync('npx wrangler d1 execute unhoused-personas --remote --command="SELECT * FROM personas" --json', { encoding: 'utf-8' });
    
    // Parse the JSON output from wrangler
    const data = JSON.parse(output);
    
    // Wrangler D1 output structure is typically:
    // [ { "results": [ { ... }, { ... } ] } ]
    const results = data[0]?.results || [];
    console.log(`Found ${results.length} personas.`);

    if (results.length === 0) {
        console.log("No personas found to export.");
        fs.writeFileSync('./personas_backup.sql', '-- No personas found in old database\n');
        process.exit(0);
    }

    // Generate SQL Insert statements
    let sqlContent = "";
    results.forEach(p => {
        // Escape single quotes in string values
        const city = p.city ? p.city.replace(/'/g, "''") : "";
        const name = p.name ? p.name.replace(/'/g, "''") : "";
        const narrative = p.narrative ? p.narrative.replace(/'/g, "''") : "";
        const image_url = p.image_url ? p.image_url.replace(/'/g, "''") : "";
        const demographics_json = p.demographics_json ? p.demographics_json.replace(/'/g, "''") : "{}";
        
        sqlContent += `INSERT INTO personas (id, created_at, city, demographics_json, name, age, narrative, image_url) VALUES (${p.id}, '${p.created_at}', '${city}', '${demographics_json}', '${name}', ${p.age}, '${narrative}', '${image_url}');\n`;
    });

    fs.writeFileSync('./personas_backup.sql', sqlContent);
    console.log("Export completed! Backup saved to ./personas_backup.sql");
} catch (error) {
    console.error("Error executing database query:", error.message);
    if (error.stdout) console.log("Output was:", error.stdout);
    if (error.stderr) console.error("Error output was:", error.stderr);
}
