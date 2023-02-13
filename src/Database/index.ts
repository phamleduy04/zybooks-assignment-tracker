import Keyv from 'keyv';
import * as log from '../Log';

// if not stated mongodb url, will use memory as database
const db = new Keyv(process.env.MONGODB);

db.on('error', (err) => log.err(err));

export default db;
