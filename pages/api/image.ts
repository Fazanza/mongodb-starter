import { MongoClient } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const client = await clientPromise;
      const db = client.db('imageDB');
      const collection = db.collection('images');

      const data = req.body; // Assuming you pass your data here
      const response = await collection.insertOne(data);

      res.status(200).json({ message: 'Data saved successfully', response });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error saving data', error });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
