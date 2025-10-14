import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';
import mongoose from 'mongoose';
import { OrderStatus, Subjects } from '@samvel-ticketing/common';
import { Order } from '../../models/order';
import { natsWrapper } from '../../nats-wrapper';

it('returns 401 if the user is not authenticated', async () => {
  await request(app).delete(`/api/orders/123`).send().expect(401);
});

it('returns an error if the order is not found', async () => {
  const orderId = new mongoose.Types.ObjectId();
  await request(app)
    .delete(`/api/orders/${orderId}`)
    .set('Cookie', global.signin().cookie)
    .send()
    .expect(404);
});

it('returns an error if the order does not belong to the user', async () => {
  const ticket = Ticket.build({
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
    .delete(`/api/orders/${order.id}`)
    .set('Cookie', global.signin().cookie)
    .send()
    .expect(401);
});

it('returns 204 if the order is deleted', async () => {
  const ticket = Ticket.build({
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
  await request(app)
    .delete(`/api/orders/${order.id}`)
    .set('Cookie', user.cookie)
    .send()
    .expect(204);

  const updatedOrder = await Order.findById(order.id);
  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('publishes an order cancelled event', async () => {
  const ticket = Ticket.build({
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

  await request(app)
    .delete(`/api/orders/${order.id}`)
    .set('Cookie', user.cookie)
    .send()
    .expect(204);
  expect(natsWrapper.client.publish).toHaveBeenCalled();
  expect(natsWrapper.client.publish).toHaveBeenCalledWith(
    Subjects.OrderCancelled,
    expect.any(String),
    expect.any(Function)
  );
});
