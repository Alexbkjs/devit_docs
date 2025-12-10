```markdown
---
url: https://help.devit.software/en/article/why-is-my-post-purchase-upsell-offer-not-displayed-r7ztw/
date_scraped: 2025-12-10T17:37:29.381Z
---

# Why is my Post-purchase upsell offer not displayed?

## Reasons Why Post-purchase Offer Not Displayed

You can check the Shopify article about [limits and considerations for post-purchase checkout extentions](https://shopify.dev/docs/apps/checkout/product-offers/post-purchase#limitations-and-considerations) for detailed information on restrictions.

Sometimes it may happen that the offer is not displayed. Here is a list of the most common reasons why it happens:

### Unsupported Payment Methods

The following payment methods are not supported for post-purchase upsells due to Shopify's limitations:

*   **Installment/Buy Now, Pay Later Services**: Including Affirm, AfterPay, Shop Pay Installments, Sezzle, Klarna, and similar services.
*   **Unsupported Payment Wallets**: Apple Pay, Amazon Pay, Google Pay, PayPal Wallet.
*   **Bank Transfer Payment Methods**: iDeal.

### Common reasons why offers are not displayed

There are a few reasons why offers may not be shown, based on Shopify's limitations:

*   If your store is multi-currency and the order is placed in a currency different from the "store currency."
*   If the ReSell app is not enabled as your post-purchase page app in the Checkout settings.
*   If the order is under $0.50 or paid with a Gift Card or COD, the offer won't show.
*   The product in the original order and the sold product are both subscription products.
*   The product’s inventory is tracked and the inventory amount equals zero or less.
*   Your product has been ordered for local delivery.
*   [Automatic payments](https://help.devit.software/en/article/how-to-connect-paypal-to-shopify-1nmugyf/) are disabled while using PayPal Express Checkout.
*   The Shopify platform is overloaded.

### What should I do if I have orders from Unsupported Payment Methods?

If your store often gets orders using unsupported payment methods like Buy Now, Pay Later services or regional options like Razorpay or Airwallex, we suggest using **thank you page offers**. These are an alternative way to display upsells and can still help increase conversions, even when standard post-purchase offers can't be shown.

If you have checked all the items listed, and the order is still not displayed, please contact our support team: [support@devit.group](mailto:support@devit.group)

Please note that Shopify supports the following payment methods: Shopify Checkout, PayPal Pro, PayPal PayFlow, Braintree, [Shop Pay](https://www.shopify.com/blog/shop-pay-checkout), and [PayPal Express](https://help.shopify.com/en/manual/payments/paypal).

If you use PayPal, please ensure that your store is approved for [PayPal Automatic payments](https://help.shopify.com/en/manual/payments/paypal/set-up-paypal#:~:text=If%20you're%20using%20a%20post-purchase%20upsell%20app%2C%20then%20Shopify%20shows%20PayPal%20as%20a%20payment%20option%20during%20checkout%2C%20even%20if%20you're%20not%20yet%20approved%20for%20Reference%20Transactions%20with%20PayPal%2C%20but%20post-purchase%20offers%20aren't%20shown%20to%20the%20customer).

Please also note that Shopify only supports vaulted card payment processors. For more information, please refer to this article: [Vaulted payment processors](https://help.devit.software/en/article/vaulted-payment-processors-1fsu0eu/).

## ✔️ Next step

Check our articles to learn more about the app's functionality:

*   [How does the post-purchase upsell offer affect my fulfillment?](/en/article/how-does-the-post-purchase-upsell-offer-affect-my-fulfillment-70t2h8/)
*   [Which payment method is supported by ReSell?](/en/article/which-payment-method-is-supported-by-resell-191jn6k/)
```