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
    // Check values (validation)
    if (!description || !amountStr) {
        console.error("oopsie both arguments (description and amounts) empty!");
        return;
    }
    // Convert amount string into decimal
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
        console.error("Oopsies this value is not a number or it doesn't have positive number");
        return;
    }
    // Open the database connection
    const db = await InitialiseDB();

    // Get todays data
    const currentDate = new Date().toISOString().split('T')[0];

    // Insert date into sqlite
    const result = await db.run(
        `INSERT INTO expenses (date, description, amount) VALUES (?, ?, ?)`,
        [currentDate, description, amount]
    );

    console.log(`Wooh expenses added successfully (ID: ${result.lastID})`);

     await db.close();
}   

export async function removeExpense() {
    // Open db connection
    const db = await InitialiseDB();
    
    // Get id from argument to remove expense
    const idStr = getArgValue(`--id`);

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
    // Removal of row on selected id
    const result = await db.run(`DELETE FROM expenses WHERE id = ?`, [id]);
    
    // Check if the result changed
    if (result.changes === 0) {
        console.error(`Error: expense with id ${id} not found`);
    } else {
        console.log(`Expense id found ${id} - expense removed.`);
    }

    // Close db
    await db.close();
}

export async function listExpenses() {
    const db = await InitialiseDB();
    const expenses = await db.all(`SELECT * FROM expenses`);

    // Validation check and to check for any expenses
    if (expenses.length === 0) {
        console.log("No expenses found, your wallet is empty");
        await db.close();
        return;
    }

    console.log("\nID   Date        Description                 Amount");
    console.log("====================================================");
    // assign variables from data from the database, then log it into table format.
    expenses.forEach(row => {
        const idStr = row.id.toString().padEnd(4);
        const dateStr = row.date.padEnd(13);
        const descStr = row.description.padEnd(28);
        const amtStr = `£${row.amount}`

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