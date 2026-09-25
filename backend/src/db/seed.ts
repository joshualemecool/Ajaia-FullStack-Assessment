import { createMysqlDatabase } from './mysql.js';

const database = await createMysqlDatabase();
await database.execute('INSERT INTO users (id, email, name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)', [1, 'alice@example.com', 'Alice']);
await database.execute('INSERT INTO users (id, email, name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)', [2, 'bob@example.com', 'Bob']);
await database.close();
console.log('Seeded Alice and Bob.');