// jest.setup.js
// Make Jest auto-use the manual mock for 'pg' before any modules load.
jest.mock('pg');
