/**
 * server.js – Express Application Entry Point
 * E-KALUSUGAN Backend API
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const db = require("./config/db");
// Middleware imports
const devBypass = require("./middleware/devBypass");

// Route imports
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const devAuthRoutes = require("./routes/devAuthRoutes");
const adminRoutes = require("./routes/adminRoutes");
const queueRoutes = require("./routes/queueRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : ["http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again in 15 minutes.",
  },
});

// Dev bypass — only mounted in development mode
if (process.env.NODE_ENV === "development") {
  app.use(devBypass);
}

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/auth", devAuthRoutes); // For development bypass logins only

// ── Health Check ───────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "E-KALUSUGAN API is running.",
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ success: false, message: "Internal server error." });
});

// ── Start Server & Test Database Connection ─────────────────────────────────
const startServer = async () => {
  try {
    // Attempt to get a connection from the pool to test it
    const connection = await db.getConnection();
    console.log(`\n✅ MySQL Database connected successfully!`);
    connection.release(); // Release the connection back to the pool

    // Start the Express server only after DB is verified
    app.listen(PORT, () => {
      console.log(`\n 🚀 E-KALUSUGAN API`);
      console.log(`  Server     : http://localhost:${PORT}`);
      console.log(`  Health     : http://localhost:${PORT}/api/health`);
      console.log(`  Environment: ${process.env.NODE_ENV}`);

      if (process.env.NODE_ENV === "development") {
        console.log(`\n  [DEV BYPASS ACTIVE]`);
        console.log(
          `  Add header  x-dev-role: patient | doctor | staff | admin`,
        );
        console.log(`  to any request to skip JWT auth.\n`);
      } else {
        console.log("");
      }
    });
  } catch (error) {
    console.error(`\n❌ Failed to connect to the MySQL database:`);
    console.error(error.message);
    process.exit(1); // Stop the server if the database isn't running
  }
};

startServer();
