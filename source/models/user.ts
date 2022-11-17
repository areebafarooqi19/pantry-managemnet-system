import User from '../interface';
import { db } from '../../db';

const userModel = {
  fetchAllUser: async () => await db.table('Users'),
  createUser: async (user: User) => await db.table('Users').insert(user),
  updateUser: async (updateUser: User, userId: string) =>
    await db
      .table('Users')
      .get(userId)
      .update({ ...updateUser }),
  deleteUser: async (id: string) => await db.table('Users').get(id).delete(),
  findUser: async (email: string) => await db.table('Users').filter({ email: email })
};

export default userModel;
