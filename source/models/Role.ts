import { db } from '../../db';
import { Role } from '../interface';

const RoleModel = {
  getRoll: async (role: string) => await db.table('Role').filter({ name: role }).run()
};

export default RoleModel;
