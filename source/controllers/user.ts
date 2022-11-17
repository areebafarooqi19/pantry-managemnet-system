import { Request, Response, NextFunction } from 'express';

import logging from '../config/logging';
import User from '../interface';
import userModel from '../models/user';

const NAMESPACE = 'User Controller';

const createData = async (req: Request, res: Response, next: NextFunction) => {
  logging.info(NAMESPACE, `POST route called`);

  const newUser: User = req.body;
  if (!(newUser.email && newUser.name && newUser.age))
    return res.status(400).json({
      status: 400,
      user: newUser,
      message: 'Missing fields'
    });

  const user: User[] = await userModel.findUser(newUser.email);

  if (user.length > 0) {
    return res.status(400).json({
      status: 400,
      user: newUser,
      message: 'User account corresponding to provided email already exists'
    });
  }

  await userModel.createUser(newUser);

  return res.status(200).json({
    status: 200,
    user: newUser,
    message: 'User created successfully'
  });
};

const readData = async (req: Request, res: Response, next: NextFunction) => {
  logging.info(NAMESPACE, `GET route called`);

  const users: User[] = await userModel.fetchAllUser();

  return res.status(200).json({
    status: 200,
    users: users,
    message: 'Success'
  });
};

const updateData = async (req: Request, res: Response, next: NextFunction) => {
  logging.info(NAMESPACE, `PUT route called`);

  const updateUser: User = req.body;

  if (!updateUser.email)
    return res.status(400).json({
      status: 400,
      user: updateUser,
      message: 'User email id missing'
    });

  if (!(updateUser.name || updateUser.age))
    return res.status(400).json({
      status: 400,
      user: updateUser,
      message: 'Values to update not provided'
    });

  const user: User[] = await userModel.findUser(updateUser.email);

  if (user.length === 0)
    return res.status(404).json({
      status: 404,
      user: updateUser,
      message: 'User account with provided email does not exist'
    });

  await userModel.updateUser(updateUser, user[0].id);

  return res.status(200).json({
    status: 200,
    user: updateUser,
    message: 'User updated successfully'
  });
};

const deleteData = async (req: Request, res: Response, next: NextFunction) => {
  logging.info(NAMESPACE, `DELETE route called`);

  const userEmail: string = req.body.email;

  if (!userEmail)
    return res.status(400).json({
      status: 400,
      message: 'User email id is missing'
    });

  const user: User[] = await userModel.findUser(userEmail);

  if (user.length === 0)
    return res.status(404).json({
      status: 404,
      userEmail: userEmail,
      message: 'User with the provided Email ID does not exist'
    });

  await userModel.deleteUser(user[0].id);

  return res.status(200).json({
    status: 200,
    email: userEmail,
    message: 'User deleted successfully'
  });
};

export default { createData, readData, updateData, deleteData };
