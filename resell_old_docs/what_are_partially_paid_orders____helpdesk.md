```yaml
---
url: https://help.devit.software/en/article/what-are-partially-paid-orders-1qm275j/
date_scraped: 2025-12-10T18:03:43.859Z
---

# What are partially paid orders?

## Partially paid orders

**In this article:**

*   [✔️ What is the reason for partially paid orders?](#️-what-is-the-reason-for-partially-paid-orders)
*   [✔️ How does it happen?](#️-how-does-it-happen)
*   [✔️ What does a customer see for Partially paid orders?](#️-what-does-a-customer-see-for-partially-paid-orders)
*   [✔️ How to identify partially paid orders?](#️-how-to-identify-partially-paid-orders)
*   [✔️ Resolving partially paid orders](#️-resolving-partially-paid-orders)
*   [✔️ Next step](#️-next-step)

## ✔️ What is the reason for partially paid orders?

Sometimes there are situations when a customer accepts a post-purchase upsell offer and receives a payment declined message.

There are **2 reasons** that lead to partially paid orders:

*   Insufficient funds on the customer’s card.
*   The payment processor denies the transaction.

## ✔️ How does it happen?

When the payment for the post-purchase upsell offer fails, Shopify will still add the upsell product to the primary order. The following situation arises: the primary order is paid, but the payment for the upsell product is failed. The order is stuck and cannot be completed.

**Important: ReSell does NOT control the payment process. The application does not affect monetary transactions between the customer and seller in any way.**

<h2>✔️ What does a customer see for Partially paid orders?</h2>

When a customer accepts a post-purchase upsell offer and the payment is failed, the customer will be redirected to the order confirmation page. There, customer will be notified that the product has been added to the order, but payment is still required. The message will also prompt to pay for the outstanding amount.

If the additional item is still not paid, after 2 hours Shopify sends an invoice email.

Shopify will not send an invoice email if the additional item has been already paid or the item has been removed from the order.

<h2>✔️ How to identify partially paid orders?</h2>

In order to track your paid orders on time, you can check their status in your **Shopify admin**. Identify such orders by the order payment status - **Partially paid**.

![](https://storage.crisp.chat/users/helpdesk/website/-/3/2/7/1/3271b421d88bd400/partially-paid-orders_1ouc857.png)

In the order timeline you will find detailed information about the order and a payment processing error.

<h2>✔️ Resolving partially paid orders</h2>

To resolve Partially paid orders try the following ways:

1.  **Get paid for the order.** That’s more profitable and preferred way. The customer has already accepted the offer, i.e. he is interested in this product and there is a high probability that he will buy it. After two hours if the additional product has not been paid, Shopify will send an invoice and remind about the payment. So, you can wait untill the customer will pay for the additional item. Note, that this is not a guarantee that the customer will pay for the upsell product. Check the next option below to handle orders with unpaid additional upsell items.
2.  **Remove the unpaid item from the order.** If the customer does not pay for upsell order, it is necessary to create conditions for the main order to be paid and completed. Thus, product should be paid or removed from the order.

If you want to remove unpaid items after a while, ReSell gives this opportunity. The app has a build-in option that removes additional product automatically.

To enable this option, follow these steps:

*   Go to **Settings** in the left-side menu.
*   Enable **Automatically remove unpaid 1-click upsell products from orders**.
*   (optional) Enable the option to send an order update email to the customer after products are removed.
*   **Set the amount of time** when the product must be removed if the order has not been paid (for example, 60 minutes).
*   Save the settings.

![](https://storage.crisp.chat/users/helpdesk/website/3271b421d88bd400/partially-paid-settings_1ea4yj0.png)

If a customer accepts an additional upsell product but there are insufficient funds on the card to complete the payment, the additional product will be automatically removed after an hour, and the order status will be updated to "Paid."

<h2>✔️ Next step</h2>

Learn more about how to [customize your offers](https://help.devit.software/en/article/can-i-customize-my-offers-v1y1xm/) and check the examples of popular offers to [get maximum benefits using Resell](https://help.devit.software/en/article/get-maximum-benefits-using-resell-1fpdaeb/).

Updated on: 20/10/2025
```