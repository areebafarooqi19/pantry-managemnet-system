import { Booking } from '../interface';
import { db } from '../../db';

const KitchenModel = {
  getKitchenCapacity: async () => await db.table('Kitchen').get('7a100d3f-6b02-465d-b87f-15338b79244f').pluck('totalCapacity').run(),
  updateKitchCapacity: async (newCapacity: number) => await db.table('Kitchen').update({ totalCapacity: newCapacity }).run()
};

export default KitchenModel;
