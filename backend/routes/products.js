const express = require("express");
const { body, validationResult, query } = require("express-validator");
const ProductService = require("../services/ProductService");
const UserService = require("../services/UserService");
const { auth, authorize } = require("../middleware/auth");
const { db } = require("../firebase");
const multer = require("multer");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("category").optional().isString().trim(),
    query("minPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Minimum price must be a positive number"),
    query("maxPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Maximum price must be a positive number"),
    query("sortBy")
      .optional()
      .isIn(["createdAt", "price", "averageRating", "stats.views"])
      .withMessage("Invalid sort field"),
    query("sortOrder")
      .optional()
      .isIn(["asc", "desc"])
      .withMessage("Invalid sort order"),
    query("search").optional().isString().trim(),
    query("artisan").optional().isString().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        page = 1,
        limit = 30,
        category,
        minPrice,
        maxPrice,
        search,
        artisan,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const filter = { status: "active" };

      if (category) filter.category = category;
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }
      if (artisan) filter.artisan = artisan;
      if (search) {
        console.warn(
          "Basic search term used:",
          search,
          "- Real search needs dedicated service."
        );
      }

      const options = {
        sortBy,
        sortOrder,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
      };

      const products = await ProductService.findMany(filter, options);

      const artisanIds = [
        ...new Set(products.map((p) => p.artisan).filter((id) => id)),
      ];
      let artisansMap = {};
      if (artisanIds.length > 0 && UserService) {
        const artisanPromises = artisanIds.map((id) =>
          UserService.findById(id).catch((err) => {
            console.error(`Error fetching artisan ${id}:`, err);
            return null;
          })
        );
        const artisans = await Promise.all(artisanPromises);
        artisansMap = artisans.reduce((map, art) => {
          if (art)
            map[art.id] = { id: art.id, name: art.name, profile: art.profile };
          return map;
        }, {});
      }

      const populatedProducts = products.map((product) => ({
        ...product,
        artisan: artisansMap[product.artisan] || null,
      }));

      const total = await ProductService.count(filter);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        products: populatedProducts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts: total,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
        },
      });
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Server error while fetching products" });
    }
  }
);

router.get("/artisan/:id", auth, async (req, res) => {
  try {
    const artisanId = req.params.id;
    const products = await ProductService.findByArtisan(artisanId);
    res.json(products);
  } catch (error) {
    console.error("Error fetching artisan products:", error);
    res.status(500).send("Server Error fetching artisan products");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await ProductService.findById(productId);

    if (!product || product.status !== "active") {
      return res
        .status(404)
        .json({ message: "Product not found or not active" });
    }

    let artisanDetails = null;
    if (product.artisan && UserService) {
      const artisan = await UserService.findById(product.artisan).catch(
        (err) => {
          console.error(
            `Error fetching artisan ${product.artisan} for product ${productId}:`,
            err
          );
          return null;
        }
      );
      if (artisan) {
        artisanDetails = {
          id: artisan.id,
          name: artisan.name,
          email: artisan.email,
          profile: artisan.profile,
        };
      }
    }

    let populatedReviews = product.reviews || [];
    const userIds = [
      ...new Set(populatedReviews.map((r) => r.userId).filter((id) => id)),
    ];
    let usersMap = {};
    if (userIds.length > 0 && UserService) {
      const userPromises = userIds.map((id) =>
        UserService.findById(id).catch((err) => {
          console.error(
            `Error fetching user ${id} for review population:`,
            err
          );
          return null;
        })
      );
      const users = await Promise.all(userPromises);
      usersMap = users.reduce((map, user) => {
        if (user)
          map[user.id] = {
            id: user.id,
            name: user.name,
            profile: user.profile,
          };
        return map;
      }, {});
    }
    populatedReviews = populatedReviews.map((review) => ({
      ...review,
      userName: usersMap[review.userId]?.name || review.userName || "Anonymous",
    }));

    const populatedProduct = {
      ...product,
      artisan: artisanDetails,
      reviews: populatedReviews,
    };

    ProductService.incrementViews(productId).catch((err) =>
      console.error(`Failed to increment views for ${productId}:`, err)
    );

    res.json(populatedProduct);
  } catch (error) {
    console.error(`Get product error for ID ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error while fetching product" });
  }
});

router.post(
  "/",
  [auth, authorize("artisan"), upload.single("productImage")],
  [
    body("name")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Product name is required (max 200 chars)"),
    body("description")
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage("Description required (10-2000 chars)"),
    body("category")
      .isIn([
        "Pottery",
        "Textiles",
        "Painting",
        "Woodwork",
        "Metalwork",
        "Sculpture",
        "Jewelry",
        "Other",
      ])
      .withMessage("Invalid category"),
    body("price")
      .isFloat({ gt: 0 })
      .withMessage("Price must be a positive number"),
    body("inventory.quantity")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Quantity must be a non-negative integer"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    if (!req.file)
      return res.status(400).json({
        errors: [{ path: "productImage", msg: "Product image is required." }],
      });

    try {
      const productData = {
        ...req.body,
        artisan: req.user.id,
        status: "active",
      };
      if (productData.inventory && typeof productData.inventory === "string") {
        try {
          productData.inventory = JSON.parse(productData.inventory);
        } catch (e) {}
      }
      productData.inventory = {
        quantity: parseInt(productData.inventory?.quantity || 0, 10),
        reservedQuantity: 0,
      };
      const product = await ProductService.createWithImage(
        productData,
        req.file
      );
      let populatedProduct = { ...product, artisan: null };
      if (UserService) {
        const artisan = await UserService.findById(product.artisan).catch(
          (err) => {
            console.error(
              `Error fetching artisan ${product.artisan} after create:`,
              err
            );
            return null;
          }
        );
        if (artisan)
          populatedProduct.artisan = {
            id: artisan.id,
            name: artisan.name,
            profile: artisan.profile,
          };
      }
      res.status(201).json({
        message: "Product created successfully",
        product: populatedProduct,
      });
    } catch (error) {
      console.error("Create product with image error:", error);
      res.status(500).json({ message: "Server error while creating product" });
    }
  }
);

router.put(
  "/:id",
  [auth, authorize("artisan"), upload.single("productImage")],
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Product name must be under 200 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage("Description must be between 10 and 2000 characters"),
    body("category")
      .optional()
      .isIn([
        "Pottery",
        "Textiles",
        "Painting",
        "Woodwork",
        "Metalwork",
        "Sculpture",
        "Jewelry",
        "Other",
      ])
      .withMessage("Invalid category"),
    body("price")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("Price must be a positive number"),
    body("inventory.quantity")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Quantity must be a non-negative integer"),
    body("status")
      .optional()
      .isIn(["active", "inactive", "archived"])
      .withMessage("Invalid status"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const productId = req.params.id;
      const product = await ProductService.findById(productId);
      if (!product)
        return res.status(404).json({ message: "Product not found" });
      if (product.artisan !== req.user.id)
        return res.status(403).json({ message: "Access denied" });

      const updateData = { ...req.body };
      if (updateData.inventory) {
        if (typeof updateData.inventory === "string") {
          try {
            updateData.inventory = JSON.parse(updateData.inventory);
          } catch (e) {}
        }
        const currentInventory = product.inventory || {};
        updateData.inventory = {
          quantity:
            updateData.inventory.quantity !== undefined
              ? parseInt(updateData.inventory.quantity, 10)
              : currentInventory.quantity,
          reservedQuantity: currentInventory.reservedQuantity || 0,
        };
      }

      const updatedProduct = await ProductService.updateWithImage(
        productId,
        updateData,
        req.file
      );
      let populatedProduct = { ...updatedProduct, artisan: null };
      if (UserService) {
        const artisan = await UserService.findById(
          updatedProduct.artisan
        ).catch((err) => {
          console.error(
            `Error fetching artisan ${updatedProduct.artisan} after update:`,
            err
          );
          return null;
        });
        if (artisan)
          populatedProduct.artisan = {
            id: artisan.id,
            name: artisan.name,
            profile: artisan.profile,
          };
      }
      res.json({
        message: "Product updated successfully",
        product: populatedProduct,
      });
    } catch (error) {
      console.error(`Update product error for ID ${req.params.id}:`, error);
      res.status(500).json({ message: "Server error while updating product" });
    }
  }
);

router.delete("/:id", [auth, authorize("artisan")], async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await ProductService.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.artisan !== req.user.id)
      return res.status(403).json({ message: "Access denied" });

    await ProductService.delete(productId);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(`Delete product error for ID ${req.params.id}:`, error);
    res.status(500).json({ message: "Server error while deleting product" });
  }
});

router.post(
  "/:id/reviews",
  [auth, authorize("buyer")],
  [
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Comment must be under 1000 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productId = req.params.id;
    const { rating, comment } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name;

    if (!userId) {
      console.error("Auth middleware did not attach user ID to request.");
      return res
        .status(401)
        .json({ message: "Authentication failed or user ID not found." });
    }

    try {
      const reviewInput = { rating, comment, userId, userName };

      console.log(
        `[products.js DEBUG] Calling addReview for product ${productId} with input:`,
        reviewInput
      );

      const addedReviewData = await ProductService.addReview(
        productId,
        reviewInput
      );

      console.log(
        `[products.js DEBUG] addReview successful, returned data:`,
        addedReviewData
      );

      res.status(201).json({
        message: "Review added successfully",
        review: addedReviewData,
      });
    } catch (error) {
      console.error(
        `[products.js DEBUG] Error in POST /:id/reviews handler for product ${productId}:`,
        error
      );
      if (error.message === "You have already reviewed this product.") {
        return res.status(409).json({ message: error.message });
      }
      if (error.message === "Product not found") {
        return res.status(404).json({ message: error.message });
      }
      if (
        error.message ===
        "Cannot add review, product owner information is missing."
      ) {
        return res.status(500).json({
          message: "Could not add review due to missing product owner info.",
        });
      }
      res
        .status(500)
        .json({ message: "Failed to add review", error: error.message });
    }
  }
);

module.exports = router;
