const express = require("express");
const { body, validationResult } = require("express-validator");
const UserService = require("../services/UserService");
const ProductService = require("../services/ProductService");
const { auth, authorize } = require("../middleware/auth");
const { getDistance } = require("../utils/geolocation");
const { db } = require("../firebase");
const router = express.Router();

router.get("/profile", auth, async (req, res) => {
  try {
    const user = await UserService.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(UserService.toJSON(user));
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
});

router.put("/profile", auth, async (req, res) => {
  try {
    const allowedUpdates = [
      "name",
      "profile",
      "artisanProfile",
      "investorProfile",
      "ambassadorProfile",
      "settings",
    ];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await UserService.update(req.user.id, updates);

    res.json({
      message: "Profile updated successfully",
      user: UserService.toJSON(user),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error while updating profile" });
  }
});

router.get("/artisans/nearest", auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const userLocation = currentUser.profile?.location;

    if (!userLocation?.latitude || !userLocation?.longitude) {
      return res
        .status(400)
        .json({
          message: "Your location is not set. Please update your profile.",
        });
    }

    const allArtisans = await UserService.findMany({ role: "artisan" });

    const artisansWithDistance = allArtisans
      .filter(
        (artisan) =>
          artisan.id !== currentUser.id &&
          artisan.profile?.location?.latitude &&
          artisan.profile?.location?.longitude
      )
      .map((artisan) => {
        const distance = getDistance(
          userLocation.latitude,
          userLocation.longitude,
          artisan.profile.location.latitude,
          artisan.profile.location.longitude
        );
        return {
          ...UserService.toJSON(artisan),
          distance: Math.round(distance * 10) / 10,
        };
      });

    artisansWithDistance.sort((a, b) => a.distance - b.distance);

    res.json({ artisans: artisansWithDistance.slice(0, 10) });
  } catch (error) {
    console.error("Get nearest artisans error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching nearest artisans" });
  }
});

router.get("/artisans", async (req, res) => {
  try {
    const { page = 1, limit = 12, location, specialty } = req.query;

    const filter = { role: "artisan" };
    if (location) filter["profile.location.city"] = location;
    if (specialty) filter["artisanProfile.craftSpecialty"] = specialty;

    const options = {
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    };

    const artisans = await UserService.findMany(filter, options);
    const sanitizedArtisans = artisans.map((user) => UserService.toJSON(user));

    const total = await UserService.count(filter);

    res.json({
      artisans: sanitizedArtisans,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalArtisans: total,
      },
    });
  } catch (error) {
    console.error("Get artisans error:", error);
    res.status(500).json({ message: "Server error while fetching artisans" });
  }
});

router.get("/artisans/unmentored", auth, async (req, res) => {
  try {
    const unmentoredArtisans = await UserService.findMany({
      role: "artisan",
      unmentored: true,
    });

    const filteredArtisans = unmentoredArtisans.filter(
      (artisan) => artisan.id !== req.user.id
    );

    res.json({ artisans: filteredArtisans.map(UserService.toJSON) });
  } catch (error) {
    console.error("Error fetching unmentored artisans:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/artisans/uninvested", auth, async (req, res) => {
  try {
    const uninvestedArtisans = await UserService.findMany({
      role: "artisan",
      uninvested: true,
    });

    const filteredArtisans = uninvestedArtisans.filter(
      (artisan) => artisan.id !== req.user.id
    );

    res.json({ artisans: filteredArtisans.map(UserService.toJSON) });
  } catch (error) {
    console.error("Error fetching unmentored artisans:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/artisans/:id", async (req, res) => {
  try {
    const artisan = await UserService.findById(req.params.id);

    if (!artisan || artisan.role !== "artisan") {
      return res.status(404).json({ message: "Artisan not found" });
    }

    const products = await ProductService.findActive(
      {
        artisan: req.params.id,
      },
      {
        limit: 50,
      }
    );

    await UserService.incrementProfileViews(artisan.id);

    res.json({
      artisan: UserService.toJSON(artisan),
      products,
    });
  } catch (error) {
    console.error("Get artisan error:", error);
    res.status(500).json({ message: "Server error while fetching artisan" });
  }
});

router.get("/my-products", [auth, authorize("artisan")], async (req, res) => {
  try {
    const { page = 1, limit = 12, status } = req.query;

    const filter = { artisan: req.user.id };
    if (status) filter.status = status;

    const options = {
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      sortBy: "createdAt",
      sortOrder: "desc",
    };

    const products = await ProductService.findMany(filter, options);
    const total = await ProductService.count(filter);

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
      },
    });
  } catch (error) {
    console.error("Get my products error:", error);
    res.status(500).json({ message: "Server error while fetching products" });
  }
});
router.get("/:id", auth, async (req, res) => {
  try {
    const userRef = db.collection("users").doc(req.params.id);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ msg: "User not found" });
    }

    const userData = doc.data();
    res.json({
      id: doc.id,
      name: userData.name,
      role: userData.role,
      profile: userData.profile,
      artisanProfile: userData.artisanProfile,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
