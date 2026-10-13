/**
 * The checkout domain. The service is SERVER ONLY — it is called from the
 * checkout page's Server Action; the vocabulary below is safe anywhere.
 */
export { checkoutService, type CheckoutService } from "./services";
export {
  CHECKOUT_STEPS,
  type CheckoutContact,
  type CheckoutDraft,
  type CheckoutFulfilmentChoice,
  type CheckoutLineInput,
  type CheckoutStep,
  type FulfilmentMethod,
  type Order,
  type OrderLine,
  type OrderStatus,
  type PlaceOrderInput,
  type PlacedOrder,
} from "./types";
