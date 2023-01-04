export interface User {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profileImageUrl?: any;
  department: string;
  roleName?: string;
  id?: string;
}

export interface TimeSlot {
  availibility: number;
  startTime: any;
  endTime?: any;
  bookingIds: string[];
}

export interface userPassword {
  userId: string;
  passwordHash: string;
}

export interface userRole {
  userId: string;
  roleId: string;
}

export interface Role {
  name: string;
  level: number;
}

export interface Booking {
  id?: string;
  userId?: string;
  subject: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  recurrunceRule?: string;
}

export interface UserBooking {
  id?: string;
  userId: string;
  bookingId: string;
}
