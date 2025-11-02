const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const OrderService = require("../services/OrderService");
const ProductService = require("../services/ProductService");
const { db } = require("../firebase");

const router = express.Router();

router.get("/artisan-stats", [auth, authorize("artisan")], async (req, res) => {
  try {
    const artisanId = req.user.id;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentOrdersSnapshot = await db
      .collection("orders")
      .where("artisanIds", "array-contains", artisanId)
      .where("status", "in", ["shipped", "delivered"])
      .where("createdAt", ">=", sevenDaysAgo)
      .get();

    const dailySales = new Map();
    const dateLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      dateLabels.push(label);
      dailySales.set(label, 0);
    }

    recentOrdersSnapshot.forEach((doc) => {
      const order = doc.data();
      const orderDate = order.createdAt.toDate();
      const dayLabel = orderDate.toLocaleDateString("en-US", {
        weekday: "short",
      });
      if (dailySales.has(dayLabel)) {
        dailySales.set(
          dayLabel,
          dailySales.get(dayLabel) + (order.pricing.total || 0)
        );
      }
    });

    const salesDataForChart = {
      labels: dateLabels,
      data: dateLabels.map((label) => dailySales.get(label)),
    };

    const topViewedProductsSnapshot = await db
      .collection("products")
      .where("artisan", "==", artisanId)
      .orderBy("stats.views", "desc")
      .limit(7)
      .get();

    const productViewsLabels = [];
    const productViewsData = [];
    topViewedProductsSnapshot.forEach((doc) => {
      const product = doc.data();
      const productName =
        product.name.length > 15
          ? product.name.substring(0, 12) + "..."
          : product.name;
      productViewsLabels.push(productName);
      productViewsData.push(product.stats.views || 0);
    });

    const viewsDataForChart = {
      labels: productViewsLabels,
      data: productViewsData,
    };

    const [pendingOrdersSnapshot, lowStockSnapshot, topProductsSnapshot] =
      await Promise.all([
        db
          .collection("orders")
          .where("artisanIds", "array-contains", artisanId)
          .where("status", "in", ["pending", "confirmed", "processing"])
          .get(),
        db
          .collection("products")
          .where("artisan", "==", artisanId)
          .where("inventory.isUnlimited", "==", false)
          .where("inventory.quantity", "<", 5)
          .get(),
        db
          .collection("products")
          .where("artisan", "==", artisanId)
          .orderBy("stats.views", "desc")
          .limit(3)
          .get(),
      ]);

    const topProducts = [];
    topProductsSnapshot.forEach((doc) =>
      topProducts.push({ id: doc.id, ...doc.data() })
    );

    res.json({
      stats: {
        orders: pendingOrdersSnapshot.size,
        lowInventory: lowStockSnapshot.size,
      },
      salesData: salesDataForChart,
      viewsData: viewsDataForChart,
      topProducts: topProducts,
    });
  } catch (error) {
    console.error("Artisan dashboard error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching artisan dashboard data" });
  }
});

module.exports = router;
