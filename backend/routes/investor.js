const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth");
const InvestmentService = require("../services/InvestmentService");
const UserService = require("../services/UserService");

router.get("/profile", [auth, authorize("investor")], async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error("Failed to fetch investor profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", [auth, authorize("investor")], async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      contact,
      bio,
      interestedCrafts,
      typicalInvestmentRange,
      investmentGoals,
      profilePicture,
    } = req.body;

    const profileUpdates = {
      name,
      "profile.bio": bio,
      "profile.avatar": profilePicture,
      "profile.contact": contact,
    };

    const investorProfileUpdates = {
      "investorProfile.interestedCrafts": interestedCrafts,
      "investorProfile.typicalInvestmentRange": typicalInvestmentRange,
      "investorProfile.investmentGoals": investmentGoals,
    };

    const updates = { ...profileUpdates, ...investorProfileUpdates };
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key]
    );

    const updatedUser = await UserService.update(userId, updates);
    res.json(updatedUser);
  } catch (error) {
    console.error("Failed to update investor profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get(
  "/dashboard-data",
  [auth, authorize("investor")],
  async (req, res) => {
    try {
      const investorId = req.user.id;
      const stats = await InvestmentService.getInvestmentStats(investorId);
      const investments = await InvestmentService.findByInvestor(investorId);
      const uniqueArtisanIds = [
        ...new Set(investments.map((inv) => inv.artisan)),
      ];
      stats.artisansSupported = uniqueArtisanIds.length;
      stats.expectedReturns = 4.8;

      const recentInvestments = investments.slice(0, 3);
      let topArtisans = [];
      if (recentInvestments.length > 0) {
        const artisanDetails = await UserService.findMany({
          id: { in: recentInvestments.map((i) => i.artisan) },
        });
        topArtisans = artisanDetails.map((artisan) => ({
          id: artisan.id,
          name: artisan.name,
          profilePic: {
            url:
              artisan.profile?.avatar ||
              `https://placehold.co/40x40/cccccc/ffffff?text=${artisan.name.charAt(
                0
              )}`,
          },
          craft: artisan.artisanProfile?.craftSpecialty?.join(", ") || "N/A",
        }));
      }

      const portfolioChartData = {
        labels: [
          "Oct 14",
          "Oct 15",
          "Oct 16",
          "Oct 17",
          "Oct 18",
          "Oct 19",
          "Oct 20",
        ],
        data: [10000, 10250, 10150, 10300, 10450, 10400, 10550].map(
          (v) => v + (stats.totalInvested || 0) - 10000
        ),
      };

      const jobsCreated = Math.floor(stats.artisansSupported * 2.5);

      res.json({
        stats,
        jobsCreated,
        portfolioChartData,
        topArtisans,
      });
    } catch (error) {
      console.error("Failed to fetch investor dashboard data:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
