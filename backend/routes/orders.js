const express = require("express");
const { body, validationResult } = require("express-validator");
const OrderService = require("../services/OrderService");
const ProductService = require("../services/ProductService");
const UserService = require("../services/UserService");
const { auth, authorize } = require("../middleware/auth");
const axios = require("axios");
const { cityCoordinates } = require("../utils/geocoding");
const { db } = require("../firebase");

const router = express.Router();

router.post(
  "/",
  [auth, authorize("buyer")],
  [
    body("items")
      .isArray({ min: 1 })
      .withMessage("Order must contain at least one item"),
    body("items.*.product").notEmpty().withMessage("Product ID is required"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    body("shippingAddress.name")
      .notEmpty()
      .withMessage("Shipping name is required"),
    body("shippingAddress.addressLine1")
      .notEmpty()
      .withMessage("Shipping address is required"),
    body("shippingAddress.city")
      .notEmpty()
      .withMessage("Shipping city is required"),
    body("payment.method")
      .isIn([
        "credit_card",
        "debit_card",
        "paypal",
        "bank_transfer",
        "cash_on_delivery",
      ])
      .withMessage("Invalid payment method"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { items, shippingAddress, billingAddress, payment } = req.body;
      const buyer = await UserService.findById(req.user.id);
      if (
        !buyer?.profile?.location?.latitude ||
        !buyer?.profile?.location?.longitude
      ) {
        return res.status(400).json({
          message:
            "Your location is not set. Please update your profile before ordering.",
        });
      }
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await ProductService.findById(item.product);
        if (!product) {
          return res
            .status(400)
            .json({ message: `Product ${item.product} not found` });
        }

        if (product.status !== "active") {
          return res
            .status(400)
            .json({ message: `Product ${product.name} is not available` });
        }

        if (
          product.inventory.quantity < item.quantity &&
          !product.inventory.isUnlimited
        ) {
          return res.status(400).json({
            message: `Insufficient inventory for ${product.name}. Available: ${product.inventory.quantity}`,
          });
        }

        const itemTotal = Number(product.price) * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          product: product.id,
          artisan: product.artisan,
          quantity: item.quantity,
          priceAtTime: product.price,
          customization: item.customization || {},
        });

        if (!product.inventory.isUnlimited) {
          await ProductService.reserveInventory(product.id, item.quantity);
        }
      }
      const artisanIds = [...new Set(orderItems.map((item) => item.artisan))];
      const tax = subtotal * 0.08;
      const shipping = subtotal > 100 ? 0 : 15;
      const total = subtotal + tax + shipping;

      const orderData = {
        buyer: req.user.id,
        items: orderItems,
        artisanIds: artisanIds,
        status: "pending",
        pricing: {
          subtotal,
          tax,
          shipping,
          total,
        },
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        payment,
      };
      const artisan = await UserService.findById(orderItems[0].artisan);
      if (
        !artisan?.profile?.location?.latitude ||
        !artisan?.profile?.location?.longitude
      ) {
        console.error(
          `Artisan ${artisan.id} is missing location data. Skipping distance calculation.`
        );
      }
      const originCity = artisan.profile.location.city;
      const destinationCity = buyer.profile.location.city;
      const originCoords = {
        lat: artisan.profile.location.latitude,
        lon: artisan.profile.location.longitude,
      };
      const destinationCoords = {
        lat: buyer.profile.location.latitude,
        lon: buyer.profile.location.longitude,
      };

      let distanceKm = 0;
      let durationHours = 0;

      if (
        typeof originCoords.lat === "number" &&
        typeof originCoords.lon === "number" &&
        typeof destinationCoords.lat === "number" &&
        typeof destinationCoords.lon === "number"
      ) {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originCoords.lat},${originCoords.lon}&destinations=${destinationCoords.lat},${destinationCoords.lon}&key=${apiKey}`;

        try {
          const response = await axios.get(url);
          const data = response.data;
          if (data?.rows?.[0]?.elements?.[0]?.status === "OK") {
            distanceKm = data.rows[0].elements[0].distance.value / 1000;
            durationHours = data.rows[0].elements[0].duration.value / 3600;
          } else {
            console.warn(
              "Distance Matrix API returned a non-OK status:",
              data?.rows?.[0]?.elements?.[0]?.status
            );
          }
        } catch (apiError) {
          console.error("Distance Matrix API call failed:", apiError.message);
        }
      } else {
        console.warn(
          "Skipping distance calculation due to incomplete coordinates."
        );
      }

      let totalWeightKg = 0;
      for (const item of orderItems) {
        totalWeightKg += item.quantity * 0.5;
      }

      orderData.logistics = {
        originCity,
        destinationCity,
        distanceKm: Math.round(distanceKm),
        estimatedDurationHours: Math.round(durationHours),
        packageWeightKg: totalWeightKg,
        recommendations: [],
      };
      const order = await OrderService.create(orderData);

      const populatedOrder = {
        ...order,
        items: await Promise.all(
          order.items.map(async (item) => {
            const product = await ProductService.findById(item.product);
            const artisan = await UserService.findById(item.artisan);
            return {
              ...item,
              product: product
                ? {
                    id: product.id,
                    name: product.name,
                    images: product.images,
                  }
                : null,
              artisan: artisan
                ? {
                    id: artisan.id,
                    name: artisan.name,
                    profile: artisan.profile,
                  }
                : null,
            };
          })
        ),
      };

      res.status(201).json({
        message: "Order created successfully",
        order: populatedOrder,
      });
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ message: "Server error while creating order" });
    }
  }
);

router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    let orders = [];
    let total = 0;

    if (req.user.role === "buyer") {
      let filter = { buyer: req.user.id };
      if (status) filter.status = status;

      const options = {
        limit: parsedLimit,
        offset: offset,
        sortBy: "createdAt",
        sortOrder: "desc",
      };
      orders = await OrderService.findMany(filter, options);
      total = await OrderService.count(filter);
    } else if (req.user.role === "artisan") {
      let baseQuery = db
        .collection("orders")
        .where("artisanIds", "array-contains", req.user.id);

      if (status) {
        baseQuery = baseQuery.where("status", "==", status);
      }

      const totalSnapshot = await baseQuery.get();
      total = totalSnapshot.size;

      const dataQuery = baseQuery
        .orderBy("createdAt", "desc")
        .limit(parsedLimit)
        .offset(offset);

      const ordersSnapshot = await dataQuery.get();
      ordersSnapshot.forEach((doc) => {
        orders.push({ ...doc.data(), id: doc.id });
      });
    }

    const populatedOrders = await Promise.all(
      orders.map(async (order) => {
        const buyer = await UserService.findById(order.buyer);
        const populatedItems = await Promise.all(
          order.items.map(async (item) => {
            const product = await ProductService.findById(item.product);
            const artisan = await UserService.findById(item.artisan);
            return {
              ...item,
              product: product
                ? {
                    id: product.id,
                    name: product.name,
                    images: product.images,
                  }
                : null,
              artisan: artisan
                ? {
                    id: artisan.id,
                    name: artisan.name,
                    profile: artisan.profile,
                  }
                : null,
            };
          })
        );

        return {
          ...order,
          buyer: buyer
            ? {
                id: buyer.id,
                name: buyer.name,
                profile: buyer.profile,
              }
            : null,
          items: populatedItems,
        };
      })
    );

    res.json({
      orders: populatedOrders,
      pagination: {
        currentPage: parsedPage,
        totalPages: Math.ceil(total / parsedLimit),
        totalOrders: total,
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Server error while fetching orders" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const order = await OrderService.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const hasAccess =
      order.buyer === req.user.id ||
      order.items.some((item) => item.artisan === req.user.id) ||
      req.user.role === "admin";

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    const buyer = await UserService.findById(order.buyer);
    const populatedItems = await Promise.all(
      order.items.map(async (item) => {
        const product = await ProductService.findById(item.product);
        const artisan = await UserService.findById(item.artisan);
        return {
          ...item,
          product: product || null,
          artisan: artisan
            ? {
                id: artisan.id,
                name: artisan.name,
                profile: artisan.profile,
              }
            : null,
        };
      })
    );

    const populatedOrder = {
      ...order,
      buyer: buyer
        ? {
            id: buyer.id,
            name: buyer.name,
            email: buyer.email,
            profile: buyer.profile,
          }
        : null,
      items: populatedItems,
    };

    res.json(populatedOrder);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ message: "Server error while fetching order" });
  }
});

router.put(
  "/:id/status",
  auth,
  [
    body("status")
      .isIn([
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ])
      .withMessage("Invalid status"),
    body("notes")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Notes must be under 500 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const order = await OrderService.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const isArtisan =
        req.user.role === "artisan" &&
        order.items.some((item) => item.artisan === req.user.id);
      const isAdmin = req.user.role === "admin";

      if (!isArtisan && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status, notes } = req.body;
      await db.collection("orders").doc(req.params.id).update({
        status: status,
      });
      const updatedOrder = await OrderService.updateStatus(
        req.params.id,
        status,
        notes,
        req.user.id
      );

      res.json({
        message: "Order status updated successfully",
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ message: "Server error while updating order" });
    }
  }
);
router.put(
  "/:id/ship",
  [
    auth,
    authorize("artisan"),
    body("partnerName")
      .notEmpty()
      .withMessage("Shipping partner name is required"),
    body("estimatedPrice")
      .isNumeric()
      .withMessage("Estimated price is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const order = await OrderService.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const isArtisanForOrder = order.artisanIds.includes(req.user.id);
      if (!isArtisanForOrder) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { partnerName, estimatedPrice } = req.body;
      const notes = `Shipped via ${partnerName}.`;

      const updatedLogistics = {
        ...order.logistics,
        selectedPartner: partnerName,
        shippingCost: estimatedPrice,
        shippedAt: new Date(),
      };

      await db
        .collection("orders")
        .doc(req.params.id)
        .update({ logistics: updatedLogistics });

      const updatedOrder = await OrderService.updateStatus(
        req.params.id,
        "shipped",
        notes,
        req.user.id
      );

      res.json({
        message: "Order marked as shipped successfully",
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Ship order error:", error);
      res.status(500).json({ message: "Server error while shipping order" });
    }
  }
);
module.exports = router;
