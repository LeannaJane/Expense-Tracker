import { InitialiseDB } from './index.js';

// Setup mock data across different months to test your filtering logic
const dummyExpenses = [
    { date: '2026-01-15', description: 'Gym Membership', amount: 35.00 },
    { date: '2026-02-14', description: 'Valentine Flowers', amount: 45.50 },
    { date: '2026-03-03', description: 'Electricity Bill', amount: 85.20 },
    { date: '2026-04-22', description: 'Grocery Haul', amount: 120.40 },
    { date: '2026-05-01', description: 'Morning Coffee', amount: 3.80 },
    { date: '2026-05-10', description: 'Burrito Lunch', amount: 12.50 },
    { date: '2026-05-25', description: 'Gas Station Fillup', amount: 65.00 },
    { date: '2026-06-18', description: 'Movie Tickets', amount: 22.00 }
];

async function runSeeder() {
    console.log('Connecting to database to seed mock records...');
    const db = await InitialiseDB();

    console.log('Inserting bulk data entries...');
    
    // Loop through each item and inject it into the table structure
    for (const expense of dummyExpenses) {
        await db.run(
            `INSERT INTO expenses (date, description, amount) VALUES (?, ?, ?)`,
            [expense.date, expense.description, expense.amount]
        );
        console.log(`Added: ${expense.description} (${expense.date})`);
    }

    console.log('Database successfully seeded with multi-month data!');
    await db.close();
}

runSeeder();