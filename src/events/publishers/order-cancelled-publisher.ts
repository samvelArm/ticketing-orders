import {
  Publisher,
  OrderCancelledEvent,
  Subjects,
} from '@samvel-ticketing/common';

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
}
