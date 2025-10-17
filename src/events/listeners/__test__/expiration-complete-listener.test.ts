import {
  ExpirationCompleteEvent,
  Subjects,
  OrderStatus,
} from '@samvel-ticketing/common';
import { Ticket } from '../../../models/ticket';
import { ExpirationCompleteListener } from '../expiration-complete-listener';
import { natsWrapper } from '../../../nats-wrapper';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { Order } from '../../../models/order';

export const setup = async () => {
  const listener = new ExpirationCompleteListener(natsWrapper.client);

  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 10,
  });
  await ticket.save();

  const order = Order.build({
    userId: new mongoose.Types.ObjectId().toHexString(),
    status: OrderStatus.Created,
    expiresAt: new Date(Date.now() + 1000),
    ticket,
    version: 0,
  });
  await order.save();

  const data: ExpirationCompleteEvent['data'] = {
    orderId: order.id,
  };

  const msg: Message = {
    ack: jest.fn(),
  } as unknown as Message;
  return { listener, data, msg, order, ticket };
};

it('updates the order status to cancelled', async () => {
  const { listener, data, msg } = await setup();
  await listener.onMessage(data, msg);
  const order = await Order.findById(data.orderId);

  expect(order).toBeDefined();
  expect(order!.status).toEqual(OrderStatus.Cancelled);
  expect(order!.version).toEqual(1);
});

it('emits an order cancelled event', async () => {
  const { listener, data, msg, order, ticket } = await setup();
  await listener.onMessage(data, msg);
  expect(natsWrapper.client.publish).toHaveBeenCalled();
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();
  await listener.onMessage(data, msg);
  expect(msg.ack).toHaveBeenCalled();
});
