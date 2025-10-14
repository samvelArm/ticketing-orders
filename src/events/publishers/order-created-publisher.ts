import {
  Publisher,
  OrderCreatedEvent,
  Subjects,
} from '@samvel-ticketing/common';

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
}
