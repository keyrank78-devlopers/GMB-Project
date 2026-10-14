function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment window. Check your connection and try again."));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout({ checkout, user, onSuccess, onFailure }) {
  await loadRazorpay();

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const razorpay = new window.Razorpay({
      key: checkout.keyId,
      amount: checkout.amount,
      currency: checkout.currency,
      name: checkout.name,
      description: checkout.description,
      order_id: checkout.orderId,
      prefill: {
        name: user?.name || "",
        email: user?.email || "",
        contact: user?.phone || "",
      },
      theme: { color: "#100e0c" },
      handler: async (response) => {
        try {
          await onSuccess(response);
          finish();
        } catch (error) {
          reject(error);
        }
      },
      modal: { ondismiss: finish },
    });

    razorpay.on("payment.failed", async (response) => {
      const error = response?.error || {};
      try {
        await onFailure({
          razorpay_order_id: error.metadata?.order_id || checkout.orderId,
          razorpay_payment_id: error.metadata?.payment_id,
          code: error.code,
          description: error.description,
          source: error.source,
          step: error.step,
          reason: error.reason,
        });
        finish();
      } catch (failure) {
        if (settled) return;
        settled = true;
        reject(failure);
      }
    });

    razorpay.open();
  });
}
