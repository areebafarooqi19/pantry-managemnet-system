import { db } from '../../db';
import { Role, TimeSlot, UserBooking } from '../interface';

const TimeSlotModel = {
  getAllTimeSlots: async () => await db('pantry-management-system').table('TimeSlot').run(),
  updateTimeSlot: async (bookingid: string, availibility: number, timeSlotId: string) =>
    await db('pantry-management-system')
      .table('TimeSlot')
      .get(timeSlotId)
      .update({
        availibility: availibility,
        bookingIds: db.row('bookingIds').append(bookingid)
      })
      .run(),
  createNewSlot: async (newTimeSlot: TimeSlot) => await db('pantry-management-system').table('TimeSlot').insert(newTimeSlot).run(),
  updateAvailability: async (newCapacity: number) =>
    await db
      .table('TimeSlot')
      .update({ availibility: db.row('availibility').add(newCapacity) })
      .run(),
  getBookingsByTime: async (startTime: any, endTime: any) => await db.table('TimeSlot').filter({ startTime: startTime, endTime: endTime }).run(),
  getTimeSlotByBookingId: async (id: string) =>
    await db
      .table('TimeSlot')
      .filter(function (data: any) {
        return data('bookingIds').contains(id);
      })
      .run(),
  deleteTimeSlot: async (id: string) => await db.table('TimeSlot').get(id).delete().run(),
  updateTimeSlotOnDelete: async (id: string, availibility: number) =>
    await db('pantry-management-system')
      .table('TimeSlot')
      .update({ bookingIds: db.row('bookingIds').difference([id]), availibility: availibility })
      .run(),
  getTimeSlot: async () => await db.table('TimeSlot').run(),
  updateTimeSlotOnBookingUpdate: async (id: string, updateTimeSlot: TimeSlot) =>
    await db
      .table('TimeSlot')
      .get(id)
      .update({ ...updateTimeSlot })
      .run()
};

export default TimeSlotModel;
