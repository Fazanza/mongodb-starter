import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const setup = async () => {
  let client;

  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const hasData = await client
      .db('test')
      .collection('images')
      .countDocuments();

    if (hasData) {
      console.log('Database already exists with data');
      client.close();
      return;
    }

    const images = [...Array(100)].map((_, index) => {
      return {
        promptNumber: index,
        choices: [
          { choice: 0, count: 0 },
          { choice: 1, count: 0 },
        ]
      }
    });

    const insert = await client
      .db('test')
      .collection('images')
      .insertMany(images);

    if (insert.acknowledged) {
      console.log('Successfully inserted records');
    }
  } catch (error) {
    return 'Database is not ready yet';
  } finally {
    if (client) {
      await client.close();
    }
  }
};

try {
  setup();
} catch {
  console.warn('Database is not ready yet. Skipping seeding...');
}

export { setup };
