import express from "express";
import cors from "cors";
import hospitalRoutes from "./src/routes/hospitalRoutes.js";
import serviceRoutes from "./src/routes/serviceRoutes.js";
import recommendationRoutes from "./src/routes/recommendationRoutes.js";
import referralRoutes from "./src/routes/referralRoutes.js";
import reportRoutes from "./src/routes/reportRoutes.js";
import alertRoutes from "./src/routes/alertRoutes.js";
import medicalStaffRoutes from "./src/routes/medicalStaffRoutes.js";
import locationRoutes from "./src/routes/locationRoutes.js";
import coordinationRoutes from "./src/routes/coordinationRoutes.js";
import { ensureCoordinationSchema, seedCoordinationData } from "./src/services/coordinationSchema.js";
import http from "http";
import { Server } from "socket.io";


const app = express();
const PORT = 5000;
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://smart-referral.vercel.app",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked origin: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.json({
    message: "MedRoute API is running",
  });
});


app.use("/api/services", serviceRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/medical-staff", medicalStaffRoutes);
app.use("/api/coordination", coordinationRoutes);


const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

app.locals.io = io;

app.use(
  "/api/hospitals",
  hospitalRoutes(io)
);


app.use("/api/location", locationRoutes(io));

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("join-referral", (referralId) => {
    const room = `referral-${referralId}`;

    socket.join(room);

    console.log(
      `Socket ${socket.id} joined ${room}`
    );
  });

  socket.on("leave-referral", (referralId) => {
    const room = `referral-${referralId}`;

    socket.leave(room);

    console.log(
      `Socket ${socket.id} left ${room}`
    );
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

ensureCoordinationSchema()
  .then(seedCoordinationData)
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize coordination data:", error);
    process.exitCode = 1;
  });
