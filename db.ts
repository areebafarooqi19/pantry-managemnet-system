// @ts-ignore
import rethinkdbdash from 'rethinkdbdash';

export const db = rethinkdbdash({
  db: 'test',
  host: 'localhost',
  port: '28015'
});
