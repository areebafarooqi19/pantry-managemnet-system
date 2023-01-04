import { Booking } from '../interface';
import { db } from '../../db';

const bookingModel = {
  createBooking: async (booking: Booking) => await db.table('Booking').insert(booking).run(),
  fetchAllBookings: async () =>
    await db
      .table('Booking')
      .eqJoin('userId', db.table('User'))
      .map({
        id: db.row('left')('id'),
        description: db.row('left')('description'),
        userId: db.row('left')('userId'),
        endTime: db.row('left')('endTime'),
        startTime: db.row('left')('startTime'),
        subject: db.row('left')('subject'),
        firstName: db.row('right')('firstName'),
        lastName: db.row('right')('lastName')
      })
      .run(),

  updateBooking: async (updatedBooking: Booking, bookingId: string) =>
    await db
      .table('Booking')
      .get(bookingId)
      .update({ ...updatedBooking })
      .run(),
  deleteBooking: async (id: string) => await db.table('Booking').get(id).delete().run(),
  getBookingByTime: async (startTime: any, endTime: any) => await db.table('Booking').filter({ startTime: startTime, endTime: endTime }).pluck('userId').run(),
  getUsersId: async (bookingId: string[]) => await db.table('Booking').getAll(db.args(bookingId)).pluck('userId').run()
};

export default bookingModel;
