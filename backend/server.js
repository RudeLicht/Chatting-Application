import express from "express"
import { createServer } from "node:http"
import { router } from "./routes/auth.js";
import cors from "cors"
import cookieParser from "cookie-parser";
import { connectDb } from "./db/mongodb.js";
import { Server } from "socket.io"
import { setupSocket } from "./socket.js";


const PORT = 3000
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    credentials: true
  },
  connectionStateRecovery: {},
});

app.use(cors({
  credentials: true,
  origin: "http://localhost:8080"
}));
app.use(express.json());
app.use(cookieParser());
app.use(router);

setupSocket(io);

await connectDb();
server.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});