const path = require("path");
const multer = require("multer");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsBase = path.join(process.cwd(), "uploads", "exam-submissions");
if (!fs.existsSync(uploadsBase)) {
  fs.mkdirSync(uploadsBase, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { examId } = req.params;
    const studentId = req.userAuth?._id?.toString() || "unknown";
    const dir = path.join(uploadsBase, examId, studentId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".zip";
    const base = path.basename(file.originalname, ext) || "project";
    const safe = base.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = [".zip"];
  if (allowed.includes(ext) || file.mimetype === "application/zip") {
    cb(null, true);
  } else {
    cb(
      new Error("Only .zip files are allowed for project submissions"),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Accept multiple field names (file, project, zipFile) - frontend may use any
const uploadFields = upload.fields([
  { name: "file", maxCount: 1 },
  { name: "project", maxCount: 1 },
  { name: "zipFile", maxCount: 1 },
]);

module.exports = (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          Object.assign(new Error("File too large. Maximum size is 50MB"), {
            statusCode: 400,
          })
        );
      }
      const e = err instanceof Error ? err : new Error(String(err));
      e.statusCode = 400;
      return next(e);
    }
    // Normalize: put first uploaded file into req.file for controller compatibility
    if (req.files) {
      const f =
        req.files["file"]?.[0] ||
        req.files["project"]?.[0] ||
        req.files["zipFile"]?.[0];
      if (f) req.file = f;
    }
    next();
  });
};
