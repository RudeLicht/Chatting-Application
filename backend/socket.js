import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { User } from './models/users.js';

const db = await open({
    filename: 'chat.db',
    driver: sqlite3.Database
});

await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_offset TEXT UNIQUE,
      username TEXT,
      content TEXT,
      room TEXT
  );
`);

// New table for tracking DM rooms
await db.exec(`
  CREATE TABLE IF NOT EXISTS dm_rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_a TEXT NOT NULL,
      user_b TEXT NOT NULL,
      UNIQUE(user_a, user_b)
  );
`);

export function setupSocket(io) {
    io.on("connection", async (socket) => {

        console.log(`New socket connected: ${socket.id}`);

        socket.on("user_connected", async (username) => {
            socket.username = username;
            console.log(`User connected: ${username} (${socket.id})`);

            try {
                const dmRooms = await db.all(
                    "SELECT user_a, user_b FROM dm_rooms WHERE user_a = ? OR user_b = ?",
                    username, username
                );
                for (const row of dmRooms) {
                    const otherUser = (row.user_a === username) ? row.user_b : row.user_a;
                    const room = `dm_${[username, otherUser].sort().join("_")}`;
                    socket.join(room);
                }
            } catch (err) {
                console.error("Failed to join DM rooms on user_connected:", err);
            }

            if (socket.username) {
                io.emit("message", {
                    data: `${username} connected`,
                    username: "System"
                });
            }
        });


        socket.on("message", async ({ data, username, room }) => {
            let result;
            try {
                result = await db.run(
                    "INSERT INTO messages (username, content, room) VALUES(?,?,?)",
                    username, data, room
                );
            } catch (error) {
                console.error("An error storing into DB", error);
                return;
            }
            if (room === "General") {
                console.log(`Message from ${username}: ${data}`);
                socket.broadcast.emit("message", { data, username, serverOffset: result.lastID });
            } else {
                console.log(`DM from ${username}: ${data}, Room:${room}`);
                socket.to(room).emit("message", { data, username, room, serverOffset: result.lastID });
                socket.to(room).emit("dm_notification", username);
            }
        });

        socket.on("create_dm", async (userToDm) => {
            const userRow = await User.findOne({ username: userToDm });
            if (!userRow) {
                socket.emit("error_message", `User "${userToDm}" does not exist.`);
                return;
            }

            const room = `dm_${[socket.username, userToDm].sort().join("_")}`;

            await db.run(
                "INSERT OR IGNORE INTO dm_rooms (user_a, user_b) VALUES (?, ?)",
                ...[socket.username, userToDm].sort()
            );

            let foundOnline = false;

            for (const [, s] of io.sockets.sockets) {
                if (s.username === userToDm) {
                    s.join(room);
                    s.emit("dm_created", socket.username);
                    foundOnline = true;
                    break;
                }
            }

            socket.join(room);
            socket.emit("dm_created", userToDm);

            if (!foundOnline) {
                console.log(`User ${userToDm} is offline — DM created but waiting for them to connect.`);
            }
        });

        socket.on("request_dm_list", async (username) => {
            try {
                const rows = await db.all(
                    "SELECT user_a, user_b FROM dm_rooms WHERE user_a = ? OR user_b = ?",
                    username, username
                );

                const dmUsers = rows.map(row =>
                    row.user_a === username ? row.user_b : row.user_a
                );

                socket.emit("dm_list", dmUsers);
            } catch (err) {
                console.error("Failed to fetch DM list:", err);
            }
        });

        socket.on("disconnect", () => {
            console.log(`Disconnected: ${socket.id}`);
            if (socket.username) {
                socket.broadcast.emit("message", {
                    data: `${socket.username} has left the chat.`,
                    username: "System"
                });
            }
        });

        socket.on("request_history", async (room) => {
            try {
                const rows = await db.all(
                    "SELECT id, username, content FROM messages WHERE room = ? ORDER BY id ASC",
                    room
                );
                for (const row of rows) {
                    socket.emit("message", {
                        data: row.content,
                        username: row.username,
                        room,
                        serverOffset: row.id
                    });
                }
            } catch (err) {
                console.error("Failed to fetch history:", err);
            }
        });

        // if (!socket.recovered) {
        //     try {
        //         await db.each(
        //             'SELECT id, content, username, room FROM messages WHERE id > ?',
        //             [socket.handshake.auth.serverOffset || 0],
        //             (_err, row) => {
        //                 socket.emit('message', {
        //                     data: row.content,
        //                     username: row.username,
        //                     room: row.room,
        //                     serverOffset: row.id
        //                 });
        //                 if (row.room !== "General") {
        //                     socket.emit("dm_notification", row.username);
        //                 }
        //             }
        //         );
        //     } catch (e) {
        //         console.error("Error reconnecting", e);
        //     }
        // }
    });
}
