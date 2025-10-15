import { Message } from 'node-nats-streaming';
import {
  TicketUpdatedEvent,
  Subjects,
  Listener,
} from '@samvel-ticketing/common';
import { Ticket } from '../../models/ticket';
import { queueGroupName } from './queue-group-name';

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: TicketUpdatedEvent['data'], msg: Message) {
    const { title, price } = data;
    const ticket = await Ticket.findByEvent(data);
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    ticket.set({ title, price });
    await ticket.save();
    msg.ack();
  }
}
