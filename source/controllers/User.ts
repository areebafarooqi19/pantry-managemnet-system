import e, { Request, Response, NextFunction, query } from 'express';
import logging from '../config/logging';
import { User, userPassword, userRole } from '../interface';
import UserModel from '../models/User';
import { accessToken } from '../middleware';
import RoleModel from '../models/Role';
import { applyQuery, generateHashPassword, getDifference, validatePassword } from '../helper';
import UserPasswordModel from '../models/UserPassword';
import UserRoleModel from '../models/UserRole';
import UserBookingModel from '../models/UserBooking';
import KitchenModel from '../models/Kitchen';
import TimeSlotModel from '../models/TimeSlot';

const bcrypt = require('bcrypt');

const NAMESPACE = 'User Controller';
const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, role, department } = req.body;

    let profileImageUrl: string = '';

    if (!req.file?.filename) {
      profileImageUrl = 'defaultImage.png';
    } else {
      profileImageUrl = req.file.filename;
    }
    let existingUser = await UserModel.findUserByEmail(email);

    if (existingUser.length) {
      return res.status(400).json({
        status: 400,
        message: 'An account is already registered with your email'
      });
    }

    const getRole = await RoleModel.getRoll(role);
    //generate hash
    const hasedPassword = await generateHashPassword(password);
    const newUser = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      phoneNumber: phoneNumber,
      profileImageUrl: profileImageUrl,
      department: department,
      permission: false
    };

    const createNewUser = await UserModel.createUser(newUser);
    if (createNewUser) {
      const createdUserid = createNewUser.generated_keys[0];
      const newUserPassword: userPassword = {
        userId: createdUserid,
        passwordHash: hasedPassword
      };

      const newUserRole: userRole = {
        userId: createdUserid,
        roleId: getRole[0].id
      };
      await UserPasswordModel.createUserPassword(newUserPassword);
      await UserRoleModel.createUserRolle(newUserRole);
      return res.status(200).json({
        status: 200,
        message: 'User created successfully'
      });
    } else {
      return res.status(400).json({
        status: 400,
        message: 'User creation failed'
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: 'Something wents wrong'
    });
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!(email && password)) {
      const nobody = await UserRoleModel.fetchNobodyAccount();
      if (nobody.length) {
        return res.status(200).json({
          status: 200,
          nobody: nobody,
          message: 'Success'
        });
      } else {
        return res.status(401).json({
          status: 401,
          message: 'Cannot get resouce'
        });
      }
    }
    const existingUser = await UserPasswordModel.getEmailAndPassword(email);

    if (existingUser.length) {
      //validate hash password
      const validPassword = await validatePassword(password, existingUser[0].password);
      if (validPassword) {
        const user = await UserRoleModel.fetchUserById(existingUser[0].id);

        //generate JWT Token
        const accesstoken = accessToken(existingUser[0].id);
        res.cookie('accesstoken', accessToken, { httpOnly: true, maxAge: 1000 * 60 * 60 }); //saving token into cookies
        delete existingUser[0].passwordHash;

        return res.status(200).json({
          status: 200,
          data: { user: { ...user[0], token: accesstoken } },

          message: 'User logged in successfully'
        });
      } else {
        return res.status(403).json({
          status: 403,
          message: 'Incorrect email or password.'
        });
      }
    } else {
      return res.status(403).json({
        status: 403,
        message: `Incorrect email or password.`
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: 'Something wents wrong'
    });
  }
};

const getAvailableUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, startTime, endTime } = req.query;
    let allUser = await UserModel.fetchAllUser();
    allUser = allUser.filter((item: any) => {
      return item.id !== 'b3986041-9626-4f67-9c76-d10de36b63d1' && item.id !== userId;
    });

    const getTimeSlot = await TimeSlotModel.getBookingsByTime(new Date(startTime as string), new Date(endTime as string));
    const capacity = await KitchenModel.getKitchenCapacity();
    if (getTimeSlot.length <= 0) {
      allUser = allUser.map((user: User) => ({ id: user.id, name: user.firstName + ' ' + user.lastName }));
      return res.status(200).json({
        status: 200,
        users: allUser,
        seatsAvailable: capacity.totalCapacity,
        message: 'Success'
      });
    }
    const a = await UserBookingModel.getAvailableUserIds(getTimeSlot[0].bookingIds);

    allUser = getDifference(allUser, a);

    let users = allUser.map((item: any) => {
      return {
        id: item.id,
        name: `${item.firstName} ${item.lastName}`
      };
    });

    if (allUser) {
      return res.status(200).json({
        status: 200,
        users: users,
        seatsAvailable: getTimeSlot[0].availibility,
        message: 'Success'
      });
    } else {
      return res.status(404).json({
        status: 404,
        message: 'Cannot get resource'
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: 'Something wents wrong'
    });
  }
};

const setPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userIds } = req.body;

    const users = await UserModel.getUserPermission(userIds);

    const updatedPermission = await users.map(async (users: any) => {
      return await UserModel.UpdateUserPermission(users.id, !users.permission);
    });

    if (updatedPermission.length) {
      return res.status(200).json({
        status: 200,
        message: 'Permission updated successfully'
      });
    } else {
      return res.status(404).json({
        status: 404,
        message: 'Permission updation failed'
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: 'Something wents wrong'
    });
  }
};
const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { limited } = req.query;
    let totalEntries = 0;
    logging.info(NAMESPACE, `GET route called`);

    let allUsers: User[] = await UserRoleModel.fetchAllUser();
    allUsers = allUsers.filter((users: any) => {
      return users.level !== 999;
    });

    allUsers.forEach((element) => {
      totalEntries++;
    });
    if (limited) {
      allUsers = allUsers.filter((users: any) => {
        return users.level !== 0;
      });
      totalEntries--;
    }

    let allUserWithQuery = applyQuery('User', allUsers, req);

    if (allUsers) {
      return res.status(200).json({
        status: 200,
        users: allUserWithQuery,
        totalEntries: totalEntries,
        message: 'Success'
      });
    } else {
      return res.status(404).json({
        status: 404,
        message: 'User not found'
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: 'Something wents wrong'
    });
  }
};

const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logging.info(NAMESPACE, `GET route called`);

    const id = req.params.id;
    const user = await UserRoleModel.fetchUserById(id);
    if (user.length) {
      return res.status(200).json({
        status: 200,
        user: user,
        message: `Success`
      });
    } else {
      return res.status(404).json({
        status: 404,
        message: `User not found`
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: 'Something wents wrong'
    });
  }
};

const updateUser = async (req: Request, res: Response) => {
  try {
    logging.info(NAMESPACE, `Update route called`);
    const { firstName, lastName, email, phoneNumber, role, department } = req.body;

    let profileImageUrl: any = null;

    if (req.file?.filename) {
      profileImageUrl = req.file.filename;
    }
    let newUser: User;
    const id = req.params.id;
    if (req.file?.filename) {
      newUser = {
        firstName,
        lastName,
        email,
        phoneNumber,
        profileImageUrl,
        department
      };
    } else {
      newUser = {
        firstName,
        lastName,
        email,
        phoneNumber,
        department
      };
    }

    const updatedUser = await UserModel.updateUser(id, newUser);
    const userRole = await UserRoleModel.getUserRoleById(id);
    const Role = await RoleModel.getRoll(role);
    if (userRole.length && Role.length) {
      const newUserRole = {
        userId: id,
        roleId: Role[0].id
      };
      const updatedRole = await UserRoleModel.updateUserRole(userRole[0].id, newUserRole);
      if (updatedUser) {
        let User = await UserModel.getUserById(id);
        User = { ...User, roleName: role };
        if (updatedUser.replaced == 1 || updatedRole.replaced == 1) {
          return res.status(200).json({
            status: 200,
            user: User,
            message: `User updated successfully`
          });
        } else if (updatedUser.unchanged == 1 && updatedRole.unchanged == 1) {
          return res.status(200).json({
            user: User,
            status: 200,
            message: `No changes made`
          });
        } else if (updatedUser.skipped == 1) {
          return res.status(404).json({
            status: 404,
            message: `User doesn't exist`
          });
        }
      }
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: 'Something wents wrong'
    });
  }
};

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logging.info(NAMESPACE, `Delete route called`);

    const id = req.params.id;
    const deletedUser = await UserModel.deleteUser(id);
    const deletedUserPassword = await UserPasswordModel.deleteUserPassword(id);
    const deletedUserRole = await UserRoleModel.deleteUserRole(id);

    if (deletedUser) {
      if (deletedUser.deleted == 1 && deletedUserPassword.deleted == 1 && deletedUserRole.deleted == 1) {
        return res.status(200).json({
          status: 200,
          message: `Deleted successfully`
        });
      } else if (deletedUser.skipped == 1) {
        return res.status(404).json({
          status: 404,
          message: `User doesn't exist`
        });
      }
    } else {
      return res.status(500).json({
        status: 500,
        message: `User deletion Failed`
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: 'Something wents wrong'
    });
  }
};

export default { createUser, login, getAllUsers, getUserById, updateUser, deleteUser, getAvailableUsers, setPermission };
