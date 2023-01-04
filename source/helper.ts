import { Booking, TimeSlot, User, UserBooking } from './interface';
import bookingModel from './models/booking';
import KitchenModel from './models/Kitchen';
import TimeSlotModel from './models/TimeSlot';
import UserModel from './models/User';
import UserBookingModel from './models/UserBooking';

const bcrypt = require('bcrypt');

export const weekDays = ['MO', 'TU', 'WE', 'TH', 'FR'];

export const generateHashPassword = async (password: string) => {
  // generate salt to hash password
  const salt = await bcrypt.genSalt(10);
  // now we set user password to hashed password
  return await bcrypt.hash(password, salt);
};

export const validatePassword = async (password: string, comparePassword: string) => {
  // check user password with hashed password stored in the database
  return await bcrypt.compare(password, comparePassword);
};
//Add hours
export function addHours(date: Date, hours: any) {
  date.setHours(date.getHours() + hours);

  return date;
}
export const createBookings = async (startTime: any, endTime: any, userId: string, attendees: string[], subject: string, description: string) => {
  const newBooking: Booking = {
    userId: userId,
    subject: subject,
    startTime: startTime.slice(0, -34),
    endTime: endTime.slice(0, -34),
    description: description ? description : ''
  };
  const createdNewBooking = await bookingModel.createBooking(newBooking);
  const newBookingId = createdNewBooking.generated_keys[0];
  const userBooking = {
    userId: userId,
    bookingId: newBookingId
  };
  await UserBookingModel.createUserBooking(userBooking);
  if (attendees) {
    if (attendees.length) {
      attendees.map(async (id: string) => {
        const userBooking = {
          userId: id,
          bookingId: newBookingId
        };
        await UserBookingModel.createUserBooking(userBooking);
      });
    }
  }

  return newBookingId;
};

export const addingAttendees = async (allBookings: any) => {
  let newBookings = [];
  for (let bookings of allBookings) {
    let users = await UserBookingModel.getUserByBookingId(bookings.id);

    var objectIntoUserarray = users.map((obj: { userId: string }) => obj.userId);

    const userDetails = await UserModel.getUsersByIds(objectIntoUserarray);

    let combiningNameOfUser = userDetails.map((users: any) => ({
      id: users.id,
      name: `${users.firstName} ${users.lastName}`
    }));

    const allBookingDetails = {
      ...bookings,

      attendees: combiningNameOfUser
    };

    newBookings.push(allBookingDetails);
  }

  return await newBookings;
};
export const newBookingCreation = async (startTime: any, endTime: any, userId: string, attendees: string[], subject: string, description: string) => {
  try {
    const newBookingId = await createBookings(startTime, endTime, userId, attendees, subject, description);
    let bookingCreated = await createBookingInTimeSlot(startTime, endTime, userId, attendees, newBookingId);
    if (bookingCreated) {
      return bookingCreated;
    }
    return null;
  } catch (err) {
    console.log(err);
  }
};
export const createBookingInTimeSlot = async (startTime: any, endTime: any, userId: string, attendees: string[], newBookingId: string) => {
  const capacity = attendees ? (attendees.length ? attendees.length + 1 : 1) : 1;

  const allSlots = await TimeSlotModel.getAllTimeSlots();

  const alreadyCreatedSlots = allSlots.filter((slot: any) => {
    return new Date(slot.startTime).toLocaleString() == new Date(startTime).toLocaleString() && new Date(slot.endTime).toLocaleString() == new Date(endTime).toLocaleString();
  });

  if (alreadyCreatedSlots.length) {
    let newSlotCapacity = alreadyCreatedSlots[0].availibility - capacity;

    if (alreadyCreatedSlots[0].availibility > 0) {
      await TimeSlotModel.updateTimeSlot(newBookingId, newSlotCapacity, alreadyCreatedSlots[0].id);
      return true;
    }
  } else {
    const kitchenCapacity = await KitchenModel.getKitchenCapacity();
    const newTimeSlot: TimeSlot = {
      availibility: kitchenCapacity.totalCapacity - capacity,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      bookingIds: [newBookingId]
    };
    await TimeSlotModel.createNewSlot(newTimeSlot);
    return true;
  }
};
export function getDifference(array1: UserBooking[], array2: UserBooking[]) {
  return array1.filter((object1) => {
    return !array2.some((object2) => {
      return object1.id === object2.userId;
    });
  });
}
export const decodeRecurrunceRule = (recurrunceRule: string) => {
  var item = recurrunceRule.split(';');
  var outputArr: any[] = [];
  for (var i = 0; i < item.length - 1; i++) {
    var a = item[i].split('=');
    outputArr.push(a);
  }
  var map = new Map(outputArr);
  const obj = Object.fromEntries(map);
  return obj;
};
export const applyQuery = (type: string, array: any[], req: any) => {
  const { field, order } = req.query;

  let allSortedUsers: any[] = [];
  if (type == 'User') {
    allSortedUsers = array.sort((userA: User, userB: User) => (userA.firstName.toLowerCase() < userB.firstName.toLowerCase() ? -1 : 1));
  } else if (type == 'Booking') {
    allSortedUsers = array.sort((userA: any, userB: any) => (userA.subject.toLowerCase() < userB.subject.toLowerCase() ? -1 : 1));
  }
  if (field) {
    if (field == 'startTime' || field == 'endTime') {
      allSortedUsers =
        order == 'ASC'
          ? array.sort((a: any, b: any) => Number(new Date(a[field as keyof typeof a])) - Number(new Date(b[field as keyof typeof b])))
          : array.sort((a, b) => Number(new Date(b[field as keyof typeof b])) - Number(new Date(a[field as keyof typeof a])));
    } else {
      allSortedUsers =
        order == 'ASC'
          ? array.sort((userA: User | any, userB: User | any) => (userA[field as keyof typeof userA].toLowerCase() < userB[field as keyof typeof userB].toLowerCase() ? -1 : 1))
          : array.sort((userA: User | any, userB: User | any) => (userA[field as keyof typeof userA].toLowerCase() > userB[field as keyof typeof userB].toLowerCase() ? -1 : 1));
    }
  }

  let allUserWithQuery = [];

  let from = req.query.from ? parseInt(req.query.from as string) : 0;
  let to = req.query.to ? (parseInt(req.query.to as string) < array.length ? parseInt(req.query.to as string) : array.length - 1) : array.length - 1;
  for (let i = from; i <= to; i++) {
    allUserWithQuery.push(allSortedUsers[i]);
  }

  return allUserWithQuery;
};
