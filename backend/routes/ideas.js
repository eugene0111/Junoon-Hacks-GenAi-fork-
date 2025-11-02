const express = require("express");
const { body, validationResult } = require("express-validator");
const IdeaService = require("../services/IdeaService");
const UserService = require("../services/UserService");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      sortBy = "votes.upvotes",
    } = req.query;

    const filter = { status: "published" };
    if (category) filter.category = category;

    const options = {
      sortBy,
      sortOrder: "desc",
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    };

    const ideas = await IdeaService.findPublished(filter, options);

    const populatedIdeas = await Promise.all(
      ideas.map(async (idea) => {
        const artisan = await UserService.findById(idea.artisan);
        return {
          ...idea,
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

    const total = await IdeaService.count(filter);

    res.json({
      ideas: populatedIdeas,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalIdeas: total,
      },
    });
  } catch (error) {
    console.error("Get ideas error:", error);
    res.status(500).json({ message: "Server error while fetching ideas" });
  }
});

router.post(
  "/",
  [auth, authorize("artisan")],
  [
    body("title")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Title is required and must be under 200 characters"),
    body("description")
      .isLength({ min: 10, max: 1000 })
      .withMessage("Description must be between 10 and 1000 characters"),
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
    body("status")
      .optional()
      .isIn(["published"])
      .withMessage("Invalid status value"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const idea = await IdeaService.create({
        ...req.body,
        artisan: req.user.id,
        status: "published",
      });

      const artisan = await UserService.findById(idea.artisan);
      const populatedIdea = {
        ...idea,
        artisan: artisan
          ? {
              id: artisan.id,
              name: artisan.name,
              profile: artisan.profile,
            }
          : null,
      };

      res.status(201).json({
        message: "Idea created successfully",
        idea: populatedIdea,
      });
    } catch (error) {
      console.error("Create idea error:", error);
      res.status(500).json({ message: "Server error while creating idea" });
    }
  }
);

router.post(
  "/:id/vote",
  auth,
  [
    body("vote")
      .isIn(["up", "down"])
      .withMessage('Vote must be "up" or "down"'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const idea = await IdeaService.findById(req.params.id);
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }

      const { vote } = req.body;

      const updatedIdea = await IdeaService.addVote(
        req.params.id,
        req.user.id,
        vote
      );

      res.json({
        message: "Vote recorded successfully",
        votes: {
          upvotes: updatedIdea.votes.upvotes,
          downvotes: updatedIdea.votes.downvotes,
          userVote: vote,
        },
      });
    } catch (error) {
      console.error("Vote on idea error:", error);
      res.status(500).json({ message: "Server error while voting" });
    }
  }
);

module.exports = router;
