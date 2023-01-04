import { User } from '../interface';
import { db } from '../../db';

//find
const UserModel = {
  fetchAllUser: async () => await db.table('User').pluck('id', 'firstName', 'lastName').run(),

  getUserPermission: async (id: string[]) => await db.table('User').getAll(db.args(id)).pluck('id', 'permission').run(),
  getUserById: async (id: string) => await db.table('User').get(id).run(),
  UpdateUserPermission: async (id: string, permission: boolean) => await db.table('User').get(id).update({ permission: permission }).run(),

  createUser: async (user: User) => await db.table('User').insert(user).run(),
  findUserByEmail: async (email: string) =>
    await db
      .table('User')
      .filter(function (user: any) {
        return user('email').match(`(?i)^${email}$`);
      })
      .run(),
  updateUser: async (userId: string, updateUser: User) =>
    await db
      .table('User')
      .get(userId)
      .update({ ...updateUser })
      .run(),
  deleteUser: async (userId: string) => await db.table('User').get(userId).delete().run(),
  getUsersByIds: async (id: any[]) => await db.table('User').getAll(db.args(id)).pluck('id', 'firstName', 'lastName').run(),
  getTotalUsers: async () => await db.table('User').count().run()
};

export default UserModel;
