// @ts-ignore
import rethinkdbdash from 'rethinkdbdash';

export const db = rethinkdbdash({
  pool: true,
  db: 'pantry-management-system',
  host: 'localhost',
  port: '28015'
});
