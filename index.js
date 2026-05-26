import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import {fileURLToPath} from 'node:url';

// Async functions are designed to handle operations that are IO bound (speed of execution is where they are limited,
// e.g query database (process is idle while waiting for the db to arrive), other examples are network connection or a hardrive.
// This allows the other parts of the program to execute without stopping/waiting for this function to finish.
// This provides a promise (an inital state of pending, sucessful and rejected.)

export async function InitialiseDB() {
    const db = await open ({
        filename: './expense.db',
        driver: sqlite3.Database
    });


   // Pauses execution, until a promise is set. Either an error or continuing)
   // Create our table if it's a brand new file
    await db.exec(`
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);
    // Returns the created/gathered database.
    return db;
}

export function getArgValue(flag) {
    // process.argv returns an array containing the command line arguments passed when Node.js is launched.
    const args = process.argv;
    // gets the index of that flag
    const index = args.indexOf(flag);

    // if the flag exists and there is a word after it, return that word.
    // !== strictly not equal to and a type check (int)
    // Node creates a hidden array called process.argv and it looks like this:
    // example: // Index:   0                    1                2                3
    // const args = ['/usr/bin/node', 'index.js', '--description', 'Coffee'];
    
    // If the index is strictly not equal to -1 then (usually means found) - then it'll increment the index till all the arguments are not empty.
    if (index !== -1 && args[index + 1]) {
        return args[index + 1];
    }
    return null;
    // returns null or the argument and index of all the arguments.
}
export async function addExpense() {
    // Get values
    const description = getArgValue('--description');
    const amountStr = getArgValue('--amount');
    const dateStr = getArgValue('--date'); 

    // Check values (validation)
    if (!description || !amountStr) {
        console.error("oopsie both arguments (description and amounts) are empty!");
        return;
    }
    // Convert amount string into decimal
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
        console.error("Oopsies this value is not a number or it doesn't have positive number");
        return;
    }

    let targetDate;

    // Check if user passed a custom date
    if (dateStr) {
        // Regex pattern to ensure format is strictly dd/mm/yyyy
        // \d{2} means exactly 2 digits, \d{4} means exactly 4 digits
        const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;

        if (!datePattern.test(dateStr)) {
            console.error("Error - date must be in the format dd/mm/yyyy (example: 15/01/2026)");
            return;
        }

        // Split the string by the slashes: "15/01/2026" becomes ["15", "01", "2026"]
        const parts = dateStr.split('/');
        const day = parts[0];
        const month = parts[1];
        const year = parts[2];

        // Validate calendar ranges
        const mNum = parseInt(month, 10);
        const dNum = parseInt(day, 10);
        const yNum = parseInt(year, 10);

        const maxDaysInMonth = new Date(yNum, mNum, 0).getDate();

        //  check months and days in a month 
        if (mNum < 1 || mNum > 12 || dNum < 1 || dNum > maxDaysInMonth) {
            console.error("Error - invalid day or month values provided.");
            return;
        }

        // Reassemble into the database standard layout: yyyy-mm-dd
        targetDate = `${year}-${month}-${day}`;
        
    } else {
        // Fall back to todays data if no date argument is passed
        targetDate = new Date().toISOString().split('T')[0];
    }

    // Open the database connection
    const db = await InitialiseDB();

    // Insert date into sqlite
    const result = await db.run(
        `INSERT INTO expenses (date, description, amount) VALUES (?, ?, ?)`,
        [targetDate, description, amount]
    );

    console.log(`Wooh expenses added successfully (ID: ${result.lastID})`);

    await db.close();
}

export async function removeExpense() {
    // Open db connection
    const db = await InitialiseDB();
    
    // Get id from argument to remove expense
    const idStr = getArgValue(`--id`);
    const monthStr = getArgValue('--month');

    // Check if id exists
    if (!idStr) {
        console.error("Error, please specify expense ID");
        return;
    }
    
    // set id to be a int to base 10
    const id = parseInt(idStr, 10);

    // Not a number check
    if (isNaN(id)){
        console.error("Error - id must be a number");
        await db.close(); 
        return;
    }

    let result;

    // Check if month argument is passed for conditional removal
    if (monthStr) {
        const monthNum = parseInt(monthStr, 10);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            console.error("Error: month must be a number between 1 and 12.");
            await db.close();
            return;
        }
        const formattedMonth = monthStr.padStart(2, '0');

        // Removal of row on selected id and matching month
        result = await db.run(
            `DELETE FROM expenses WHERE id = ? AND strftime('%m', date) = ?`, 
            [id, formattedMonth]
        );
    } else {
        // Removal of row on selected id
        result = await db.run(`DELETE FROM expenses WHERE id = ?`, [id]);
    }
    
    // Check if the result changed
    if (result.changes === 0) {
        if (monthStr) {
            console.error(`Error: expense with id ${id} not found in month ${monthStr}`);
        } else {
            console.error(`Error: expense with id ${id} not found`);
        }
    } else {
        console.log(`Expense id found ${id} - expense removed.`);
    }

    // Close db
    await db.close();
}

export async function listExpenses() {
    const db = await InitialiseDB();
    
    const monthStr = getArgValue('--month');
    
    // Create an array to convert numbers into month names
    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    let expenses;

    // If month is passed as an arg, it will be filtered by that month
    if (monthStr) {
        const monthNum = parseInt(monthStr, 10);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            console.error("Error: month must be a number between 1 and 12.");
            await db.close();
            return;
        }

        // SQLite expects two digits for months (e.g. "05" instead of "5")
        const formattedMonth = monthStr.padStart(2, '0');

        console.log(`\n Showing expenses for: ${monthNames[monthNum - 1]}`);
        
        // Query only matching months using strftime
        expenses = await db.all(
            `SELECT * FROM expenses WHERE strftime('%m', date) = ?`, 
            [formattedMonth]
        );
    } else {
        // shows all expenses
        console.log(`\nShowing ALL expenses`);
        expenses = await db.all(`SELECT * FROM expenses`);
    }

    // Validation check and to check for any expenses
    if (expenses.length === 0) {
        console.log("No expenses found for this selection.");
        await db.close();
        return;
    }

    console.log("ID   Date        Description                 Amount");
    console.log("====================================================");
    // assign variables from data from the database, then log it into table format.
    expenses.forEach(row => {
        const idStr = row.id.toString().padEnd(4);
        const dateStr = row.date.padEnd(13);
        const descStr = row.description.padEnd(28);
        const amtStr = `£${row.amount}`;

        console.log(`${idStr}${dateStr}${descStr}${amtStr}`);
    });

    console.log("");
    await db.close();
    return expenses;
}

export async function totalExpenses() {
    // set db
    const db = await InitialiseDB();
    // query database and get the sum of the amount
    const result = await db.get(`SELECT SUM(amount) as total FROM expenses`);
    
    // check to show total or 0 if none
    const total = result.total || 0;

    // log total spent
    console.log(`Total Spent £${total}`);

    // Close db
    await db.close();
}

// --- THE COMMAND ROUTER ---
async function main() {
    // process.argv[2] grabs the main keyword (like 'add' or 'list')
    const command = process.argv[2];

    switch (command) {
        case 'add':
            await addExpense();
            break;

        case 'list':
            await listExpenses();
            break;

        case 'total':
            await totalExpenses();
            break;

        case 'remove':
            await listExpenses();
            await removeExpense();
            await listExpenses();
            break;

        default:
            console.log("Welcome to your Expense Tracker CLI!");
            console.log("Usage:");
            console.log("  node index.js add --description <msg> --amount <num>");
            console.log("  node index.js list");
            break;
    }
}

main();