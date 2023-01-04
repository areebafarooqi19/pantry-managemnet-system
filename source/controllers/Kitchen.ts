import e, { Request, Response, NextFunction } from 'express';
import KitchenModel from '../models/Kitchen';
import TimeSlotModel from '../models/TimeSlot';

const getCapacity = async (req: Request, res: Response, next: NextFunction) => {
  const kitchenCapacity = await KitchenModel.getKitchenCapacity();

  return res.status(200).json({
    status: 200,
    capacity: kitchenCapacity,
    messege: 'Success'
  });
};
const setCapacity = async (req: Request, res: Response, next: NextFunction) => {
  const { capacity } = req.body;

  const kitchenCapacity = await KitchenModel.getKitchenCapacity();
  const newCapacity = capacity - kitchenCapacity.totalCapacity;

  const newKitchenCapacity = await KitchenModel.updateKitchCapacity(capacity);
  await TimeSlotModel.updateAvailability(newCapacity);
  console.log(newKitchenCapacity);
  if (newKitchenCapacity.replaced == 1) {
    return res.status(200).json({
      status: 200,
      capacity: capacity,
      messege: 'Kitchen Capacity updated successfully'
    });
  } else {
    return res.status(400).json({
      status: 400,
      capacity: capacity,
      messege: 'Kitchen capacity updation failed'
    });
  }
};

export default { getCapacity, setCapacity };
