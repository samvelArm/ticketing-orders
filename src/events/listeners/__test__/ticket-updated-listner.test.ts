import { Ticket } from '../../../models/ticket';
import { TicketUpdatedListener } from '../ticket-updated-listener';
import { natsWrapper } from '../../../nats-wrapper';
import mongoose, { version } from 'mongoose';
import { Message } from 'node-nats-streaming';
import { TicketUpdatedEvent } from '@samvel-ticketing/common';

export const setup = async () => {
  const listener = new TicketUpdatedListener(natsWrapper.client);
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 10,
  });

  await ticket.save();

  const data: TicketUpdatedEvent['data'] = {
    id: ticket.id,
    title: 'new concert',
    price: 20,
    userId: new mongoose.Types.ObjectId().toHexString(),
    version: 1,
  };
  const msg: Message = {
    ack: jest.fn(),
  } as unknown as Message;

  return { listener, data, msg };
};

it('updates a ticket', async () => {
  const { listener, data, msg } = await setup();
  await listener.onMessage(data, msg);
  const updatedTicket = await Ticket.findById(data.id);
  expect(updatedTicket).toBeDefined();
  expect(updatedTicket!.title).toEqual(data.title);
  expect(updatedTicket!.price).toEqual(data.price);
  expect(updatedTicket!.version).toEqual(data.version);
  expect(msg.ack).toHaveBeenCalled();
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();
  data.version = 10;
  try {
    await listener.onMessage(data, msg);
  } catch (err) {
    expect(err).toBeDefined();
  }
  expect(msg.ack).not.toHaveBeenCalled();
});
