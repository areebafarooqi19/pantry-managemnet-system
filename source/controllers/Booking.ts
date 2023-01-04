import e, { Request, Response, NextFunction } from 'express';
import logging from '../config/logging';
import { addHours, addingAttendees, applyQuery, decodeRecurrunceRule, newBookingCreation } from '../helper';
import { Booking, UserBooking } from '../interface';
import bookingModel from '../models/booking';
import TimeSlotModel from '../models/TimeSlot';
import UserBookingModel from '../models/UserBooking';
const NAMESPACE = 'User Controller';

const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, startTime, endTime, description, recurrunceRule, attendees, subject } = req.body;
    let bookingCreated: any = false;
    const getTimeSlot = await TimeSlotModel.getBookingsByTime(startTime, endTime);
    if (getTimeSlot.availibility <= 0) {
      return res.status(400).json({
        status: 400,
        message: 'This slot is fully booked'
      });
    }
    if (!recurrunceRule) {
      bookingCreated = await newBookingCreation(startTime, endTime, userId, attendees, subject, description);

      if (bookingCreated) {
        return res.status(200).json({
          status: 200,
          message: 'Booking created successfully'
        });
      } else {
        return res.status(400).json({
          status: 400,
          message: 'Booking creation failed'
        });
      }
    }

    if (recurrunceRule) {
      const decodedRecurrunceRule = decodeRecurrunceRule(recurrunceRule);

      let bookingCreated: any = null;
      let newStartTime = new Date(startTime);
      let newEndTime = new Date(endTime);
      let hours = 0;

      if (decodedRecurrunceRule.COUNT) {
        let count = parseInt(decodedRecurrunceRule.COUNT);
        for (let i = 1; i <= count; i++) {
          if (newStartTime.getDay() == 6 || newStartTime.getDay() == 0) {
            i = i - 1;
          }
          if (newStartTime.getDay() != 6 && newStartTime.getDay() != 0) {
            bookingCreated = await newBookingCreation(newStartTime.toString(), newEndTime.toString(), userId, attendees, subject, description);
          }

          newStartTime = addHours(new Date(newStartTime), 24 * parseInt(decodedRecurrunceRule.INTERVAL));
          newEndTime = addHours(new Date(newEndTime), 24 * parseInt(decodedRecurrunceRule.INTERVAL));
        }
      }

      if (decodedRecurrunceRule.FREQ == 'DAILY' && decodedRecurrunceRule.UNTIL) {
        const untilDate = new Date(`${decodedRecurrunceRule.UNTIL.slice(0, 4)}-${decodedRecurrunceRule.UNTIL.slice(4, 6)}-${decodedRecurrunceRule.UNTIL.slice(6, 8)}`);
        hours = 24;
        while (newStartTime <= untilDate) {
          bookingCreated = await newBookingCreation(newStartTime.toString(), newEndTime.toString(), userId, attendees, subject, description);

          newStartTime = addHours(new Date(newStartTime), hours * parseInt(decodedRecurrunceRule.INTERVAL));
          newEndTime = addHours(new Date(newEndTime), hours * parseInt(decodedRecurrunceRule.INTERVAL));
        }
        if (parseInt(decodedRecurrunceRule.INTERVAL) % 2 == 0 || parseInt(decodedRecurrunceRule.INTERVAL) == 1) {
          bookingCreated = await newBookingCreation(newStartTime.toString(), newEndTime.toString(), userId, attendees, subject, description);
        }
      }

      if (bookingCreated) {
        return res.status(200).json({
          status: 200,
          message: 'Booking created successfully'
        });
      } else {
        return res.status(400).json({
          status: 400,
          message: 'Booking creation failed'
        });
      }
    }
  } catch (error) {
    console.log('Error', error);
  }
};

const getAllBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logging.info(NAMESPACE, `GET route called`);
    const { userId } = req.query;
    let totalEntries = 0;
    let allBookings: Booking[] = await bookingModel.fetchAllBookings();

    allBookings = allBookings.filter((decodedRecurrunceRule, index) => {
      return index === allBookings.findIndex((booking) => decodedRecurrunceRule.id === booking.id);
    });

    let newBooking = await addingAttendees(allBookings);
    newBooking.forEach((element) => {
      totalEntries++;
    });

    if (newBooking.length) {
      newBooking = applyQuery('Booking', newBooking, req);
    }
    newBooking = newBooking.map((booking) => ({ ...booking, isReadonly: userId !== booking.userId }));

    const coeff = 1000 * 60 * 30;
    const date = new Date();
    const currentDate = new Date(Math.round(date.getTime() / coeff) * coeff);
    newBooking = newBooking.map((booking) => ({ ...booking, isReadonly: Number(new Date(booking.startTime)) < Number(currentDate) || userId !== booking.userId }));

    if (allBookings) {
      return res.status(200).json({
        status: 200,
        bookings: newBooking,
        totalEntries: totalEntries,
        message: 'Success'
      });
    } else {
      return res.status(404).json({
        status: 404,
        message: 'Cannot get booking'
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const getBookingbyId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logging.info(NAMESPACE, `GET route called`);
    const id = req.params.id;
    let allBookings: Booking[] = await bookingModel.fetchAllBookings();
    allBookings = allBookings.filter((decodedRecurrunceRule, index) => {
      return index === allBookings.findIndex((booking) => decodedRecurrunceRule.id === booking.id);
    });

    let newBooking = await addingAttendees(allBookings);
    newBooking = newBooking.filter((booking: any) => {
      return booking.id == id;
    });
    if (newBooking.length) {
      newBooking = applyQuery('Booking', newBooking, req);
    }

    if (allBookings) {
      return res.status(200).json({
        status: 200,
        bookings: newBooking,
        message: 'Success'
      });
    } else {
      return res.status(404).json({
        status: 404,
        message: 'Cannot get booking'
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const updateBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const { startTime, endTime, description, recurrunceRule, subject, attendees, userId } = req.body;
    const getTimeSlot = await TimeSlotModel.getBookingsByTime(startTime, endTime);
    if (getTimeSlot.availibility <= 0) {
      return res.status(400).json({
        status: 400,
        message: 'This slot is fully booked'
      });
    }
    const allSlot = await TimeSlotModel.getTimeSlot();
    let slot: any = allSlot.filter((slots: any) => {
      return slots.bookingIds.includes(id);
    });

    var userBookings = await UserBookingModel.getUserBooking(id);
    const convertObjIntoArray: UserBooking[] = [];
    userBookings.forEach((item: any) => {
      convertObjIntoArray.push(item.userId);
    });
    let userIds: any[] = convertObjIntoArray.filter((obj) => !attendees.includes(obj));

    userIds = userIds.filter((id: string) => {
      return id !== userId;
    });
    let updatedTimeSlot: any = null;
    const deletedUserBooking = await UserBookingModel.deleteUserBookingByUserId(userIds, id);
    if (deletedUserBooking.deleted >= 0) {
      const newTimeSlot = {
        availibility: slot[0].availibility + deletedUserBooking.deleted,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        bookingIds: slot[0].bookingIds
      };
      slot[0].availibility = newTimeSlot.availibility;
      updatedTimeSlot = await TimeSlotModel.updateTimeSlotOnBookingUpdate(slot[0].id, newTimeSlot);
    }

    const newBooking: Booking = {
      subject,
      startTime: startTime.slice(0, -34),
      endTime: endTime.slice(0, -34),
      description: description ? description : ''
    };

    const updateBooking = await bookingModel.updateBooking(newBooking, id);
    attendees.forEach(async (item: string) => {
      const userBooking = await UserBookingModel.getUserByIds(id, item);

      if (userBooking.length == 0) {
        const booking: UserBooking = {
          userId: item,
          bookingId: id
        };
        await UserBookingModel.createUserBooking(booking);

        const newTimeSlot = {
          availibility: slot[0].availibility - 1,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          bookingIds: slot[0].bookingIds
        };

        slot[0].availibility = newTimeSlot.availibility;
        updatedTimeSlot = await TimeSlotModel.updateTimeSlotOnBookingUpdate(slot[0].id, newTimeSlot);
      }
    });

    if (updateBooking.replaced == 1 || updatedTimeSlot.replaced == 1) {
      return res.status(200).json({
        status: 200,
        message: `Booking updated successfully`
      });
    } else if (updateBooking.skipped == 1) {
      return res.status(404).json({
        status: 404,
        message: `Booking doesn't exist`
      });
    } else {
      return res.status(200).json({
        status: 200,
        message: `No changes made`
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const deleteBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logging.info(NAMESPACE, `Delete route called`);

    const id = req.params.id;
    const deleteBooking = await bookingModel.deleteBooking(id);
    const userBookingId = await UserBookingModel.getUserBooking(id);
    const timeslot = await TimeSlotModel.getTimeSlotByBookingId(id);
    timeslot.map(async (data: any) => {
      if (data.bookingIds.length == 1) {
        await TimeSlotModel.deleteTimeSlot(data.id);
      } else {
        const availibility = data.availibility + userBookingId.length;
        await TimeSlotModel.updateTimeSlotOnDelete(id, availibility);
      }
    });

    await UserBookingModel.deleteUserBooking(id);

    if (userBookingId.length) {
      if (deleteBooking) {
        if (deleteBooking.deleted == 1) {
          return res.status(200).json({
            status: 200,
            message: `Booking Deleted successfully`
          });
        } else if (deleteBooking.skipped == 1) {
          return res.status(404).json({
            status: 404,
            message: `Booking doesn't exist`
          });
        } else {
          return res.status(500).json({
            status: 500,
            message: `Booking deletion failed`
          });
        }
      } else {
        return res.status(500).json({
          status: 500,
          message: `Booking deletion failed`
        });
      }
    } else {
      return res.status(404).json({
        status: 404,
        message: `Booking doesn't exist`
      });
    }
  } catch (error) {
    console.log(error);
  }
};

export default {
  createBooking,
  getAllBookings,
  getBookingbyId,
  deleteBooking,
  updateBooking
};
