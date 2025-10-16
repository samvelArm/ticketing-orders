import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';

it('returns an error if the order is not found', async () => {
  const orderId = new mongoose.Types.ObjectId();
  await request(app)
    .get(`/api/orders/${orderId}`)
    .set('Cookie', global.signin().cookie)
    .send()
    .expect(404);
});

it('returns an error if the order does not belong to the user', async () => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  });
  await ticket.save();

  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin().cookie)
    .send({ ticketId: ticket.id })
    .expect(201);

  await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', global.signin().cookie)
    .send()
    .expect(401);
});

it('returns 401 if the user is not authenticated', async () => {
  const orderId = new mongoose.Types.ObjectId();
  await request(app).get(`/api/orders/${orderId}`).send().expect(401);
});

it('returns the order if it exists and belongs to the user', async () => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  });
  await ticket.save();
  const user = global.signin();
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user.cookie)
    .send({ ticketId: ticket.id })
    .expect(201);

  const { body: fetchedOrder } = await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', user.cookie)
    .send()
    .expect(200);
  expect(fetchedOrder.id).toEqual(order.id);
});
