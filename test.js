import {InitialiseDB, getArgValue} from './index.js';

async function main() {
    console.log('Connecting to database...Beep_boop');
    const db = await InitialiseDB();
    console.log('Database is ready');

    const desc = getArgValue('--description');
    const amt = getArgValue('--amount');

    console.log('Capture Description:', desc);
    console.log('Capture Amount:', amt);

    await db.close();
}

main();