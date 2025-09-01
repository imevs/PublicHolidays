import fs from "fs/promises";
import path from "path";

const refineHolidays = async (filePath: string) => {
    const fileContent = await fs.readFile(filePath, "utf-8");

    // Use a regular expression to find and replace date fields
    const refinedContent = fileContent.replace(
        /"date":\s*"([^"]+)"/g, // Match "date": "value"
        (_, date) => {
            const formattedDate = new Date(date).toISOString().split("T")[0]; // Format as YYYY-MM-DD
            return `"date": "${formattedDate}"`;
        }
    );

    // Write the refined content back to the file
    await fs.writeFile(filePath, refinedContent, "utf-8");
    console.log(`Refined dates in file: ${filePath}`);
};

// Directory containing holiday files
const holidaysDir = path.join("../src/data/holidays_v2");

(async () => {
// Read all files in the directory
    (await fs.readdir(holidaysDir)).forEach((file) => {
        const filePath = path.join(holidaysDir, file);
        if (file.endsWith(".ts") && !file.endsWith("index.ts") && !file.endsWith("types.ts")) {
            console.log(`Processing file: ${file}`);
            refineHolidays(filePath);
        }
    });
})();
