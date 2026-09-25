import { createMysqlDatabase } from './mysql.js';

const database = await createMysqlDatabase();
await database.close();
console.log('MySQL schema is ready.');