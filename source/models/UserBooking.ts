import { db } from '../../db';
import { Role, UserBooking } from '../interface';

const UserBookingModel = {
  createUserBooking: async (userBooking: UserBooking) => await db.table('UserBooking').insert(userBooking).run(),
  getAllUserBooking: async () =>
    await db
      .table('UserBooking')
      .eqJoin('userId', db.table('User'))
      .eqJoin(db.row('left')('bookingId'), db.table('Booking'))
      .map({
        id: db.row('left')('left')('bookingId'),
        firstName: db.row('left')('right')('firstName'),
        lastName: db.row('left')('right')('lastName'),
        startTime: db.row('right')('startTime'),
        endTime: db.row('right')('endTime'),
        description: db.row('right')('description'),
        userId: db.row('left')('left')('userId'),
        department: db.row('left')('right')('department')
      })
      .run(),
  // deleteUserBooking: async (id: string) => await db.table('UserBooking').get(id).delete().run(),
  getUserBooking: async (id: string) => await db.table('UserBooking').filter({ bookingId: id }).run(),
  deleteUserBooking: async (id: string) => await db.table('UserBooking').filter({ bookingId: id }).delete().run(),
  getAllBookingExistingUser: async () => await db.table('UserBooking').pluck('userId').run(),
  getAllUsers: async () => await db.table('UserBooking').run(),
  getAvailableUserIds: async (id: string[]) => await db.table('UserBooking').getAll(db.args(id), { index: 'bookingId' }).pluck('userId').run(),
  getUserByIds: async (id: string, userId: string) => await db.table('UserBooking').filter({ bookingId: id, userId: userId }).run(),
  getAllUsersName: async () =>
    await db
      .table('UserBooking')
      .eqJoin('userId', db.table('User'))
      .map({
        id: db.row('left')('bookingId'),
        firstName: db.row('right')('firstName'),
        lastName: db.row('right')('lastName')
      })
      .run(),
  getUserByBookingId: async (id: string) => await db.table('UserBooking').filter({ bookingId: id }).pluck('userId').run(),
  deleteUserBookingByUserId: async (userId: string[], bookingId: string) => await db.table('UserBooking').getAll(db.args(userId), { index: 'userId' }).filter({ bookingId: bookingId }).delete().run()
};

export default UserBookingModel;
