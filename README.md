[# Expense-Tracker](https://roadmap.sh/projects/expense-tracker)

## Features
- **DataBase usage** - uses a local SQL database
- **Input Validation** - input checks against invalid or missing inputs.
- **Month Filtering** - filters months using sql date processing
- **Real Time dates** - custom dates can be added using calender configurations (`dd/mm/yyyy`)
- **Overall usage** - add, remove, filter, view, and calculates total expenses.

## Usage

1. Clone this project
2. npm install

3. Command usage:
Examples:

**Add expense**:
# Add expenses with descriptions and amounts
node index.js add --description "Coca cola" --amount 4.50
node index.js add --description "Mcdonalds" --amount 15.20
node index.js add --description "Gym Membership" --amount 35.00 --date 15/01/2026

**Test using seed.js**:
node seed.js

**List expenses**:
# View all expenses ever tracked
node index.js list

# Filter to view only expenses logged in May (5)
node index.js list --month 5

**Finacial summary**:
# View the running total of all expenses combined
node index.js total

**Remove an expense**:
# Remove expense no filtering
node index.js remove --id 2
## Remove an expense with month filtering
node index.js remove --month 5 --id 2





