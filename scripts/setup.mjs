import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const setup = async () => {
  let client;

  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const hasData = await client
      .db('imageDB')
      .collection('images')
      .countDocuments();

    if (hasData > 0) {
      console.log('Database already exists with data');
      client.close();
      return;
    }

    const images = [...Array(100)].map((_, index) => {
      return {
        promptNumber: index + 1,
        choices: [
          { Image1_q1: 0, Image2_q1: 0 },
          { Image1_q2: 0, Image2_q2: 0 },
          { Image1_q3: 0, Image2_q3: 0 },
          { Image1_q4: 0, Image2_q4: 0 },
        ]
      }
    });

    const insert = await client
      .db('imageDB')
      .collection('images')
      .insertMany(images);

    if (insert.acknowledged) {
      console.log('Successfully inserted records');
    }
  } catch (error) {
    return 'Database is not ready yet';
  }
};

try {
  setup();
} catch {
  console.warn('Database is not ready yet. Skipping seeding...');
}

export { setup };
