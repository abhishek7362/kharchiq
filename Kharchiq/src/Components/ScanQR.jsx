import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

function ScanQR({ onClose, onExpenseAdded }) {
  const [awaitingReturn, setAwaitingReturn] = useState(false);
  const scannerRef = useRef(null);
  const [paymentData, setPaymentData] = useState(null);
  const [enteredAmount, setEnteredAmount] = useState("");
  const [paymentStarted, setPaymentStarted] = useState(false);
  const startPromiseRef = useRef(null);
  const getCategoryFromMerchant = (merchantName) => {
    const name = merchantName.toLowerCase();

    if (
      name.includes("restaurant") ||
      name.includes("food") ||
      name.includes("cafe") ||
      name.includes("pizza") ||
      name.includes("swiggy") ||
      name.includes("zomato")
    ) {
      return "Food";
    }

    if (
      name.includes("amazon") ||
      name.includes("flipkart") ||
      name.includes("shopping") ||
      name.includes("mall")
    ) {
      return "Shopping";
    }

    if (
      name.includes("metro") ||
      name.includes("uber") ||
      name.includes("ola") ||
      name.includes("transport")
    ) {
      return "Transport";
    }

    if (
      name.includes("hospital") ||
      name.includes("pharmacy") ||
      name.includes("medical") ||
      name.includes("clinic")
    ) {
      return "Health";
    }

    if (
      name.includes("school") ||
      name.includes("college") ||
      name.includes("education")
    ) {
      return "Education";
    }

    return "Other";
  };

  useEffect(() => {
    let cancelled = false;

    const startScanner = async () => {
      if (cancelled) return;

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      try {
        const startPromise = scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
            aspectRatio: 1,
          },
          (decodedText) => {
            console.log("QR Code detected:", decodedText);

            try {
              if (!decodedText.startsWith("upi://pay")) {
                alert("This is not a UPI QR code.");
                return;
              }

              const upiUrl = new URL(decodedText);

              const params = new URLSearchParams(upiUrl.search);

              const upiId = params.get("pa");
              const merchantName = params.get("pn");
              const amount = params.get("am");

              setPaymentData({
                upiId: upiId || "Unknown",
                merchantName: merchantName || "Unknown Merchant",
                amount: amount || "",
                qrData: decodedText,
              });

              scanner
                .stop()
                .then(() => {
                  scanner.clear();
                })
                .catch((error) => {
                  console.log(error);
                });
            } catch (error) {
              console.error("UPI QR error:", error);
              alert("Unable to read this UPI QR code.");
            }
          },
          () => {},
        );

        startPromiseRef.current = startPromise;

        await startPromise;

        if (cancelled) {
          await scanner.stop().catch(() => {});
          scanner.clear();
        }
      } catch (error) {
        console.error("Camera/Scanner error:", error);
      }
    };

    startScanner();

    return () => {
      cancelled = true;

      const cleanup = async () => {
        try {
          if (startPromiseRef.current) {
            await startPromiseRef.current.catch(() => {});
          }

          if (scannerRef.current) {
            await scannerRef.current.stop().catch(() => {});
            scannerRef.current.clear();
            scannerRef.current = null;
          }
        } catch (error) {
          console.log(error);
        }
      };

      cleanup();
    };
  }, []);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && awaitingReturn) {
        setPaymentStarted(true);
        setAwaitingReturn(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [awaitingReturn]);

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <div className="scanner-modal-header">
          <div>
            <h2>Scan QR Code</h2>
            <p>Point your camera at a UPI QR code</p>
          </div>

          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>

        {!paymentData ? (
          <>
            <div id="qr-reader"></div>

            <p className="scanner-help">
              Keep the QR code inside the scanning box.
            </p>
          </>
        ) : (
          <div className="payment-confirmation">
            <div className="payment-icon">₹</div>

            <h2>Payment Details</h2>

            <div className="payment-detail">
              <span>Merchant</span>
              <strong>{paymentData.merchantName}</strong>
            </div>

            <div className="payment-detail">
              <span>UPI ID</span>
              <strong>{paymentData.upiId}</strong>
            </div>

            <div className="payment-detail">
              <span>Amount</span>

              {paymentData.amount ? (
                <strong>₹{paymentData.amount}</strong>
              ) : (
                <div className="amount-input-small">
                  <span>₹</span>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={enteredAmount}
                    onChange={(e) => setEnteredAmount(e.target.value)}
                  />
                </div>
              )}
            </div>

            <button
              className="pay-upi-btn"
              onClick={() => {
                const amount = paymentData.amount || enteredAmount;

                if (!amount || Number(amount) <= 0) {
                  alert("Please enter a valid amount.");
                  return;
                }

                const confirmed = window.confirm(
                  `Pay ₹${Number(amount).toFixed(2)} to ${paymentData.merchantName}?`,
                );
                if (!confirmed) return;

                // Original QR string ko bilkul waisa hi rakho.
                // Sirf tab amount jodo jab QR me pehle se na ho.
                let payUrl = paymentData.qrData;
                if (!paymentData.amount) {
                  payUrl +=
                    (payUrl.includes("?") ? "&" : "?") +
                    `am=${Number(amount).toFixed(2)}&cu=INR`;
                }
                setAwaitingReturn(true);
                setPaymentStarted(true);
                window.location.href = payUrl;
              }}
            >
              Pay via UPI
            </button>
            {paymentStarted && (
              <div className="payment-status">
                <div className="payment-status-icon">✓</div>

                <h3>Payment Started</h3>

                <p>Complete the payment in your UPI app.</p>

                <p className="payment-warning">
                  After completing the payment, return to Kharchiq and confirm
                  the transaction.
                </p>

                <button
                  className="payment-complete-btn"
                  onClick={() => {
                    const amount = Number(paymentData.amount || enteredAmount);

                    if (!amount || amount <= 0) {
                      alert("Invalid payment amount.");
                      return;
                    }

                    const newExpense = {
                      id: Date.now(),
                      amount: amount,
                      category: getCategoryFromMerchant(
                        paymentData.merchantName,
                      ),
                      note: paymentData.merchantName,
                      date: new Date().toLocaleDateString("en-IN"),
                    };

                    onExpenseAdded(newExpense);

                    alert("Expense added successfully!");

                    setPaymentData(null);
                    setEnteredAmount("");
                    setPaymentStarted(false);
                  }}
                >
                  I Completed the Payment
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ScanQR;
