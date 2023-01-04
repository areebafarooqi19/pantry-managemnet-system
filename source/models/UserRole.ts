import { db } from '../../db';
import { userRole } from '../interface';

const UserRoleModel = {
  createUserRolle: async (userRole: userRole) => await db.table('UserRole').insert(userRole).run(),
  fetchAllUser: async () =>
    await db('pantry-management-system')
      .table('UserRole')
      .eqJoin('userId', db('pantry-management-system').table('User'))
      .eqJoin(db.row('left')('roleId'), db('pantry-management-system').table('Role'))
      .map({
        id: db.row('left')('left')('userId'),
        firstName: db.row('left')('right')('firstName'),
        lastName: db.row('left')('right')('lastName'),
        email: db.row('left')('right')('email'),
        phoneNumber: db.row('left')('right')('phoneNumber'),
        profileImageUrl: db.row('left')('right')('profileImageUrl'),
        roleName: db.row('right')('name'),
        level: db.row('right')('level'),
        department: db.row('left')('right')('department'),
        permission: db.row('left')('right')('permission')
      })
      .run(),
  fetchUserById: async (id: string) =>
    await db('pantry-management-system')
      .table('UserRole')
      .eqJoin('userId', db('pantry-management-system').table('User'))
      .eqJoin(db.row('left')('roleId'), db('pantry-management-system').table('Role'))
      .map({
        id: db.row('left')('left')('userId'),
        firstName: db.row('left')('right')('firstName'),
        lastName: db.row('left')('right')('lastName'),
        email: db.row('left')('right')('email'),
        phoneNumber: db.row('left')('right')('phoneNumber'),
        profileImageUrl: db.row('left')('right')('profileImageUrl'),
        roleName: db.row('right')('name'),
        level: db.row('right')('level'),
        department: db.row('left')('right')('department'),
        permission: db.row('left')('right')('permission')
      })
      .filter({ id: id })
      .run(),
  getUserRoleById: async (userId: string) => await db.table('UserRole').filter({ userId: userId }).run(),
  updateUserRole: async (id: string, updatedUserRole: userRole) =>
    await db
      .table('UserRole')
      .get(id)
      .update({ ...updatedUserRole })
      .run(),
  deleteUserRole: async (userId: string) => await db.table('UserRole').filter({ userId: userId }).delete().run(),
  fetchNobodyAccount: async () =>
    await db('pantry-management-system')
      .table('UserRole')
      .eqJoin('userId', db('pantry-management-system').table('User'))
      .zip()
      .eqJoin('roleId', db('pantry-management-system').table('Role'))
      .zip()
      .map({
        id: db.row('userId'),
        firstName: db.row('firstName'),
        lastName: db.row('lastName'),
        email: db.row('email'),
        phoneNumber: db.row('phoneNumber'),
        profileImageUrl: db.row('profileImageUrl'),
        level: db.row('level'),
        roleName: db.row('name'),
        department: db.row('department')
      })

      .filter({ level: 999 })
      .run()
};

export default UserRoleModel;
