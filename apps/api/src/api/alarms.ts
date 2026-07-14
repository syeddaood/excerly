import { NextApiRequest, NextApiResponse } from 'next';

let alarms = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'POST':
      // Create a new alarm
      const newAlarm = req.body;
      alarms.push(newAlarm);
      res.status(201).json(newAlarm);
      break;
    case 'PUT':
      // Edit an existing alarm
      const { id, ...updatedAlarm } = req.body;
      alarms = alarms.map(alarm => alarm.id === id ? { ...alarm, ...updatedAlarm } : alarm);
      res.status(200).json({ message: 'Alarm updated' });
      break;
    case 'DELETE':
      // Delete an alarm
      const { alarmId } = req.query;
      alarms = alarms.filter(alarm => alarm.id !== alarmId);
      res.status(200).json({ message: 'Alarm deleted' });
      break;
    default:
      res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
