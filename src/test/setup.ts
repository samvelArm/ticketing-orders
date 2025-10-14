import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jsonwebtoken from 'jsonwebtoken';

jest.mock('../nats-wrapper');

let mongo: MongoMemoryServer;

declare global {
  var signin: () => { cookie: string[]; id: string };
}

global.signin = () => {
  const payload = {
    id: new mongoose.Types.ObjectId().toHexString(),
    email: 'test@test.com',
  };
  const token = jsonwebtoken.sign(payload, process.env.JWT_KEY!);
  const session = { jwt: token };
  const sessionJSON = JSON.stringify(session);
  const base64 = Buffer.from(sessionJSON).toString('base64');
  return { cookie: [`session=${base64}`], id: payload.id };
};

beforeAll(async () => {
  process.env.JWT_KEY = 'asdfasdf';
  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();

  await mongoose.connect(mongoUri, {});
});

beforeEach(async () => {
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongo) {
    await mongo.stop();
  }
  await mongoose.connection.close();
});
