const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const LogisticsAdvisorService = require("../services/LogisticsAdvisorService");
const { db } = require("../firebase");

const router = express.Router();

const getOrderStatus = (order) => {
  if (Array.isArray(order.timeline) && order.timeline.length > 0) {
    return (
      order.timeline[order.timeline.length - 1].status ||
      order.status ||
      "unknown"
    );
  }
  return order.status || "unknown";
};

router.get("/", [auth, authorize("artisan")], async (req, res) => {
  try {
    const allArtisanOrders = [];
    const shippableStatuses = ["pending", "confirmed", "processing"];

    const ordersSnapshot = await db
      .collection("orders")
      .where("artisanIds", "array-contains", req.user.id)
      .orderBy("createdAt", "desc")
      .get();

    ordersSnapshot.forEach((doc) => {
      allArtisanOrders.push({ ...doc.data(), id: doc.id });
    });

    const pendingOrders = allArtisanOrders.filter((order) =>
      shippableStatuses.includes(getOrderStatus(order))
    );

    const ordersWithRecommendations = pendingOrders.map((order) => {
      const recommendations = LogisticsAdvisorService.getRecommendations(order);
      const existingLogistics = order.logistics || {};
      return { ...order, logistics: { ...existingLogistics, recommendations } };
    });

    res.json({ ordersAwaitingShipment: ordersWithRecommendations });
  } catch (error) {
    console.error("Logistics Hub error:", error);
    res.status(500).json({ message: "Error fetching logistics information" });
  }
});

module.exports = router;
