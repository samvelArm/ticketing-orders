import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';
import { OrderStatus } from '../../models/order';
import mongoose from 'mongoose';

it('returns an error if the user is not authenticated', async () => {
  await request(app).get('/api/orders').send().expect(401);
});

const buildTicket = async (title: string, price: number) => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: title,
    price: price,
  });
  await ticket.save();
  return ticket;
};

it('fetches orders for a user', async () => {
  const user1 = global.signin();
  const user2 = global.signin();
  const ticket1 = await buildTicket('concert1', 20);
  const ticket2 = await buildTicket('concert2', 50);
  const ticket3 = await buildTicket('concert3', 100);

  const { body: order1 } = await request(app)
    .post('/api/orders')
    .set('Cookie', user1.cookie)
    .send({ ticketId: ticket1.id })
    .expect(201);
  const { body: order2 } = await request(app)
    .post('/api/orders')
    .set('Cookie', user2.cookie)
    .send({ ticketId: ticket2.id })
    .expect(201);

  const { body: order3 } = await request(app)
    .post('/api/orders')
    .set('Cookie', user2.cookie)
    .send({ ticketId: ticket3.id })
    .expect(201);

  const response = await request(app)
    .get('/api/orders')
    .set('Cookie', user1.cookie)
    .send()
    .expect(200);
  expect(response.body.length).toEqual(1);
  expect(response.body[0].id).toEqual(order1.id);
  expect(response.body[0].ticket.id).toEqual(ticket1.id);
  expect(response.body[0].ticket.title).toEqual(ticket1.title);
  expect(response.body[0].ticket.price).toEqual(ticket1.price);
  expect(response.body[0].status).toEqual(OrderStatus.Created);
  expect(response.body[0].expiresAt).toEqual(order1.expiresAt);
  expect(response.body[0].userId).toEqual(user1.id);
  expect(response.body[0].id).toEqual(order1.id);

  const response2 = await request(app)
    .get('/api/orders')
    .set('Cookie', user2.cookie)
    .send()
    .expect(200);
  expect(response2.body.length).toEqual(2);
  expect(response2.body[0].id).toEqual(order2.id);
  expect(response2.body[1].id).toEqual(order3.id);
  expect(response2.body[0].ticket.id).toEqual(ticket2.id);
  expect(response2.body[1].ticket.id).toEqual(ticket3.id);
  expect(response2.body[0].ticket.title).toEqual(ticket2.title);
  expect(response2.body[1].ticket.title).toEqual(ticket3.title);
  expect(response2.body[0].ticket.price).toEqual(ticket2.price);
  expect(response2.body[1].ticket.price).toEqual(ticket3.price);
  expect(response2.body[0].status).toEqual(OrderStatus.Created);
  expect(response2.body[1].status).toEqual(OrderStatus.Created);
  expect(response2.body[0].expiresAt).toEqual(order2.expiresAt);
  expect(response2.body[1].expiresAt).toEqual(order3.expiresAt);
  expect(response2.body[0].userId).toEqual(user2.id);
  expect(response2.body[1].userId).toEqual(user2.id);
});
