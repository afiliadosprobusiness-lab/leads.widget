import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";

interface PayPalButtonProps {
    amount: string;
    currency?: string;
    onSuccess: (details: any) => void;
}

export function PayPalPaymentButton({ amount, currency = "USD", onSuccess }: PayPalButtonProps) {
    const { theme } = useTheme();
    const [isLoaded, setIsLoaded] = useState(false);

    const initialOptions = {
        clientId: "AQ5hjLAKkJBn0slvYmWGg3Sr9jqtOhhLFFT_ZeNsF4c9JUUP3VOcCXG7LgvsyEIK6TI30rIpgBbuqcIV", // Production Client ID
        currency: currency,
        intent: "capture",
    };

    return (
        <div className="w-full max-w-md mx-auto z-0 relative">
            <PayPalScriptProvider options={initialOptions}>
                <PayPalButtons
                    style={{
                        layout: "vertical",
                        color: "gold",
                        shape: "rect",
                        label: "subscribe",
                        height: 50
                    }}
                    createOrder={(data, actions) => {
                        console.log("PayPal: Creating Order...", data);
                        return actions.order.create({
                            intent: "CAPTURE",
                            purchase_units: [
                                {
                                    amount: {
                                        currency_code: currency,
                                        value: amount,
                                    },
                                    description: "Lead Widget Pro Subscription"
                                },
                            ],
                        });
                    }}
                    onApprove={async (data, actions) => {
                        console.log("PayPal: Payment Approved!", data);
                        if (actions.order) {
                            try {
                                const details = await actions.order.capture();
                                console.log("PayPal: Capture Success:", details);
                                onSuccess(details);
                            } catch (err) {
                                console.error("PayPal Capture Error:", err);
                            }
                        }
                    }}
                    onError={(err) => {
                        console.error("PayPal Error:", err);
                        alert("Hubo un error con PayPal. Revisa la consola.");
                    }}
                />
            </PayPalScriptProvider>
        </div>
    );
}
