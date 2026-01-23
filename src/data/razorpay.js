import { APP_NAME } from "./config";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const handlePayment = async ({
    order,
    onError,
    onSuccess
}) => {
    const loaded = await loadRazorpayScript();

    if (!loaded) {
      onError?.call("Failed to load Razorpay. Check your internet connection.");
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY,
      amount: order.price * 100,
      currency: order.currency,
      name: APP_NAME,
      description: order.description,
      order_id: order.orderId,
      handler: onSuccess,
      prefill: {
        name: order.name,
        email: order.email,
        contact: order.phone,
      },
      theme: { color: "#ed5a09" },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };