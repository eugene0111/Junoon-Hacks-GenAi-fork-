const express = require("express");
const { body, validationResult } = require("express-validator");
const InvestmentService = require("../services/InvestmentService");
const UserService = require("../services/UserService");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/",
  [auth, authorize("investor")],
  [
    body("artisan").notEmpty().withMessage("Artisan ID is required"),
    body("type")
      .isIn(["grant", "micro_loan", "equity_investment", "pre_order_funding"])
      .withMessage("Invalid investment type"),
    body("amount")
      .isFloat({ min: 1 })
      .withMessage("Amount must be at least $1"),
    body("purpose")
      .isLength({ min: 10, max: 1000 })
      .withMessage("Purpose must be between 10 and 1000 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const artisan = await UserService.findById(req.body.artisan);
      if (!artisan || artisan.role !== "artisan") {
        return res.status(400).json({ message: "Invalid artisan" });
      }

      const investment = await InvestmentService.create({
        ...req.body,
        investor: req.user.id,
      });

      const investor = await UserService.findById(investment.investor);
      const populatedInvestment = {
        ...investment,
        investor: investor
          ? {
              id: investor.id,
              name: investor.name,
              profile: investor.profile,
            }
          : null,
        artisan: artisan
          ? {
              id: artisan.id,
              name: artisan.name,
              profile: artisan.profile,
              artisanProfile: artisan.artisanProfile,
            }
          : null,
      };

      res.status(201).json({
        message: "Investment created successfully",
        investment: populatedInvestment,
      });
    } catch (error) {
      console.error("Create investment error:", error);
      res
        .status(500)
        .json({ message: "Server error while creating investment" });
    }
  }
);

router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;

    let filter = {};
    if (req.user.role === "investor") {
      filter.investor = req.user.id;
    } else if (req.user.role === "artisan") {
      filter.artisan = req.user.id;
    }

    if (status) filter.status = status;
    if (type) filter.type = type;

    const options = {
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      sortBy: "createdAt",
      sortOrder: "desc",
    };

    const investments = await InvestmentService.findMany(filter, options);

    const populatedInvestments = await Promise.all(
      investments.map(async (investment) => {
        const investor = await UserService.findById(investment.investor);
        const artisan = await UserService.findById(investment.artisan);
        return {
          ...investment,
          investor: investor
            ? {
                id: investor.id,
                name: investor.name,
                profile: investor.profile,
              }
            : null,
          artisan: artisan
            ? {
                id: artisan.id,
                name: artisan.name,
                profile: artisan.profile,
                artisanProfile: artisan.artisanProfile,
              }
            : null,
        };
      })
    );

    const total = await InvestmentService.count(filter);

    res.json({
      investments: populatedInvestments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalInvestments: total,
      },
    });
  } catch (error) {
    console.error("Get investments error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching investments" });
  }
});

router.post(
  "/",
  [
    auth,
    authorize("investor"),
    body("artisanId", "Artisan ID is required").notEmpty(),
    body("amount", "Investment amount must be a positive number").isFloat({
      gt: 0,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { artisanId, amount } = req.body;
      const investorId = req.user.id;
      const investorName = req.user.name;

      const newInvestment = await InvestmentService.create({
        investorId,
        investorName,
        artisanId,
        amount,
      });

      res.status(201).json({
        message: "Investment successful!",
        investment: newInvestment,
      });
    } catch (error) {
      console.error("Failed to create investment:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

module.exports = router;
