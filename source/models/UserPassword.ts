import { db } from '../../db';
import { userPassword } from '../interface';

const UserPasswordModel = {
  // fetchAllBookings: async () => await db.table('Bookings').run(),
  createUserPassword: async (userPassword: userPassword) => await db.table('UserPassword').insert(userPassword).run(),
  getEmailAndPassword: async (email: string) =>
    await db
      .table('User')
      .eqJoin('id', db.table('UserPassword'), { index: 'userId' })
      .zip()
      .map({
        id: db.row('userId'),
        name: db.row('firstName'),
        lastName: db.row('lastName'),
        email: db.row('email'),
        phoneNumber: db.row('phoneNumber'),
        profileImageUrl: db.row('profileImageUrl'),
        password: db.row('passwordHash'),
        department: db.row('department')
      })
      .filter(function (user: any) {
        return user('email').match(`(?i)^${email}$`);
      })
      .run(),

  deleteUserPassword: async (userId: string) => await db.table('UserPassword').filter({ userId: userId }).delete().run()
};

export default UserPasswordModel;
