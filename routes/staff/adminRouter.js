const express = require("express");

const adminRouter = express.Router();

//register

adminRouter.post("/register", (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: "Admin has registered",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
});

//login

adminRouter.post("/login", (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: "Admin has logged in",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
});

//get all

adminRouter.get("/", (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: "All admins",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
});

//get single

adminRouter.get("/:id", (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: "Single admin",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
});

//update

adminRouter.put("/:id", (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: "Update admin",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
});

// delete

adminRouter.delete("/:id", (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: "Delete admin",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
});

// suspend teacher

adminRouter.put("/suspend/teacher/:id", (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: " admin suspended teacher",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
});

//unsuspend teacher

adminRouter.put("/unsuspend/teacher/:id", (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: " admin unsuspended teacher",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
});

// withdraw teacher

adminRouter.put("/withdraw/teacher/:id", (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: " admin withdrawed teacher",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
});

//unwithdraw teacher

adminRouter.put("/unwithdraw/teacher/:id", (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: " admin unwithdrawed teacher",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
});

// publish exam

adminRouter.put("/publish/exam/:id", (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: " admin published teacher",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
});

// unpublish exam

adminRouter.put("/unpublish/exam/:id", (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: " admin unpublished teacher",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
});
module.exports = adminRouter;
