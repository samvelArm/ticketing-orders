import { Ticket } from '../../models/ticket';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import { natsWrapper } from '../../nats-wrapper';
import { Subjects } from '@samvel-ticketing/common';

it('returns an error if the ticket is not found', async () => {
  const ticketId = new mongoose.Types.ObjectId();
  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin().cookie)
    .send({ ticketId })
    .expect(404);
});

it('returns an error if the ticket is already reserved', async () => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  });
  await ticket.save();
  const order = Order.build({
    ticket: ticket,
    userId: '123',
    status: OrderStatus.Created,
    expiresAt: new Date(),
    version: 0,
  });
  await order.save();
  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin().cookie)
    .send({ ticketId: ticket.id })
    .expect(400);
});

it('reserves a ticket', async () => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  });
  await ticket.save();
  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin().cookie)
    .send({ ticketId: ticket.id })
    .expect(201);
  const order = await Order.findOne({
    ticket: ticket,
    userId: '123',
    status: OrderStatus.Created,
    expiresAt: new Date(),
  });
  expect(order).toBeDefined();
});

it('publishes an order created event', async () => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  });
  await ticket.save();
  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signin().cookie)
    .send({ ticketId: ticket.id })
    .expect(201);
  expect(natsWrapper.client.publish).toHaveBeenCalled();
  expect(natsWrapper.client.publish).toHaveBeenCalledWith(
    Subjects.OrderCreated,
    expect.any(String),
    expect.any(Function)
  );
});
