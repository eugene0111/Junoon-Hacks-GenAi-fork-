import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import BuyerHeader from "../../components/layout/BuyerHeader.jsx";
import Footer from "../../components/layout/Footer.jsx";

const TrashIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    ></path>
  </svg>
);

export default function CartPage() {
  const { cartItems, cartTotal, removeFromCart, updateQuantity, placeOrder } =
    useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    addressLine1: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError("Please log in to place an order.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await placeOrder(shippingInfo);
      setOrderSuccess(true);

    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not place the order."
      );
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="font-sans bg-gray-50 min-h-screen">
        <BuyerHeader />
        <main className="pt-32 pb-12">
          <div className="container mx-auto px-6 text-center">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h1 className="text-3xl font-bold text-google-green mb-4">
                Order Placed Successfully!
              </h1>
              <p className="text-gray-600 mb-8">
                Thank you for your purchase. You will receive a confirmation
                email shortly.
              </p>
              <Link
                to="/buyer/market"
                className="inline-block bg-google-blue text-white font-semibold px-8 py-3 rounded-lg hover:bg-google-red transition-colors duration-300"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </main>
        <Footer /> {}
      </div>
    );
  }

  return (
    <div className="font-sans bg-gray-50 min-h-screen">
      <BuyerHeader />
      <main className="pt-32 pb-12">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">
            Your Shopping Cart
          </h1>
          {cartItems.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                {" "}
                Your Cart is Empty{" "}
              </h2>
              <p className="text-gray-500 mb-8">
                {" "}
                Looks like you haven't added any handcrafted items yet.{" "}
              </p>
              <Link
                to="/buyer/market"
                className="inline-block bg-google-blue text-white font-semibold px-8 py-3 rounded-lg hover:bg-google-red transition-colors duration-300"
              >
                Start Exploring
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                {cartItems.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between border-b py-4"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.images[0]?.url || "/placeholder.png"}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <div>
                        <Link
                          to={`/product/${item._id}`}
                          className="font-bold text-lg hover:text-google-blue"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm text-gray-500">
                          by {item.artisan.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item._id, parseInt(e.target.value))
                        }
                        className="w-16 p-1 border rounded-md text-center"
                        min="1"
                      />
                      <p className="font-semibold w-24 text-right">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md h-fit">
                <h2 className="text-2xl font-bold border-b pb-4 mb-4">
                  Order Summary
                </h2>
                <div className="flex justify-between mb-2">
                  <p>Subtotal</p>
                  <p>₹{cartTotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between mb-4">
                  <p>Shipping</p>
                  <p>TBD</p>
                </div>
                <div className="flex justify-between font-bold text-xl border-t pt-4">
                  <p>Total</p>
                  <p>₹{cartTotal.toFixed(2)}</p>
                </div>

                <form onSubmit={handlePlaceOrder} className="mt-6 space-y-3">
                  <h3 className="text-xl font-bold">Shipping Address</h3>
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={shippingInfo.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                  <input
                    type="text"
                    name="addressLine1"
                    placeholder="Address Line 1"
                    value={shippingInfo.addressLine1}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={shippingInfo.city}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                  <input
                    type="text"
                    name="postalCode"
                    placeholder="Postal Code"
                    value={shippingInfo.postalCode}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                  <input
                    type="text"
                    name="country"
                    placeholder="Country"
                    value={shippingInfo.country}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  {!isAuthenticated && (
                    <p className="text-amber-600 text-sm">
                      Please{" "}
                      <Link to="/" className="font-bold underline">
                        log in
                      </Link>{" "}
                      to place your order.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !isAuthenticated}
                    className="w-full bg-google-green text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                  >
                    {loading ? "Processing..." : "Place Order"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer /> {}
    </div>
  );
}
