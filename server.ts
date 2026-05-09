import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;
  const MAX_USERS_PER_ROOM = 15;

  app.use(express.json());

  // Track users in rooms
  const rooms: Record<string, Set<string>> = {};
  const userCurrentRoom: Record<string, string> = {}; // Track which room each user is in
  const roomWaitingQueues: Record<string, string[]> = {};
  
  interface RoomState {
    hostId: string | null;
    speakers: string[];
    queue: string[];
    sukuchaActive?: boolean;
    sukuchaVideoId?: string | null;
  }
  const roomStates: Record<string, RoomState> = {};
  const roomBans: Record<string, Record<string, number>> = {}; // roomId -> { userId -> expireTime }

  // Track user hearts
  const userHearts: Record<string, number> = {};

  interface UserInfo {
    username: string;
    profile: string;
    status: string;
    statusText: string;
    avatar: string;
    uid?: string;
  }
  const userInfos: Record<string, UserInfo> = {};

  interface RoomMetadata {
    id: string;
    title: string;
    description: string;
    creatorId: string;
    isPrivate?: boolean;
    passkey?: string;
  }
  const roomMetadata: Record<string, RoomMetadata> = {
    "lobby": { id: "lobby", title: "ロビー", description: "最初のロビーです。誰でも歓迎！", creatorId: "system", isPrivate: false },
    "test-room-1": { id: "test-room-1", title: "テスト：雑談部屋", description: "誰でも歓迎の雑談用テストルームです。", creatorId: "system", isPrivate: false },
    "test-room-2": { id: "test-room-2", title: "テスト：最新技術ルーム", description: "最新のテクノロジーについて熱く語り合いましょう。", creatorId: "system", isPrivate: false },
  };

  const findAvailableLobby = () => {
    let i = 1;
    while (true) {
      const lobbyId = i === 1 ? "lobby" : `lobby-${i}`;
      const lobbyName = i === 1 ? "ロビー" : `ロビー ${i}`;
      const room = rooms[lobbyId];
      if (!room || room.size < MAX_USERS_PER_ROOM) {
        // Ensure metadata exists
        if (!roomMetadata[lobbyId]) {
          roomMetadata[lobbyId] = {
            id: lobbyId,
            title: lobbyName,
            description: `${lobbyName}です。まずはここで交流しましょう！`,
            creatorId: "system"
          };
          broadcastAvailableRooms();
        }
        return lobbyId;
      }
      i++;
    }
  };

  const broadcastRoomState = (roomId: string) => {
    const state = roomStates[roomId];
    if (state) {
      io.to(roomId).emit("talk-state-update", state);
    }
  };

  const broadcastAvailableRooms = () => {
    const roomsWithCounts = Object.values(roomMetadata).map(room => ({
      ...room,
      userCount: (rooms[room.id] ? rooms[room.id].size : 0)
    }));
    io.emit("available-rooms", roomsWithCounts);
  };

  const leaveAllRooms = (socket: any) => {
    delete userCurrentRoom[socket.id];
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;

      if (rooms[roomId]) {
        rooms[roomId].delete(socket.id);
        socket.to(roomId).emit("user-left", socket.id);

        const state = roomStates[roomId];
        if (state) {
          state.speakers = state.speakers.filter(id => id !== socket.id);
          state.queue = state.queue.filter(id => id !== socket.id);
          
          // Re-fill speakers from queue
          while (state.speakers.length < 2 && state.queue.length > 0) {
            const nextId = state.queue.shift();
            if (nextId) state.speakers.push(nextId);
          }

          // Elect new host if needed
          if (state.hostId === socket.id) {
            const remainingUsers = Array.from(rooms[roomId]);
            state.hostId = remainingUsers.length > 0 ? remainingUsers[0] : null;
          }
          
          if (rooms[roomId].size === 0) {
            // Keep public rooms alive, but dynamic rooms can be cleared if truly abandoned
            // Note: We don't delete roomMetadata here for dynamic rooms to allow easier re-entry 
            // unless we strictly want to garbage collect. Let's keep metadata longer.
            if (roomId.startsWith("dynamic-") && !rooms[roomId]) {
                delete rooms[roomId];
                delete roomStates[roomId];
            }
          } else {
            broadcastRoomState(roomId);
          }

          // Check for waiting queue
          if (rooms[roomId] && rooms[roomId].size < MAX_USERS_PER_ROOM && roomWaitingQueues[roomId] && roomWaitingQueues[roomId].length > 0) {
            const nextUserId = roomWaitingQueues[roomId].shift();
            if (nextUserId) {
              const nextSocket = io.sockets.sockets.get(nextUserId);
              if (nextSocket) {
                nextSocket.emit("room-available", { roomId });
              }
            }
          }
        }
      }
      socket.leave(roomId);
    }
  };

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Send available rooms on connection
    const roomsWithCounts = Object.values(roomMetadata).map(room => ({
      ...room,
      userCount: (rooms[room.id] ? rooms[room.id].size : 0)
    }));
    socket.emit("available-rooms", roomsWithCounts);

    socket.on("join-room", (roomId: string, username: string, profile: string = "", statusInfo: { status: string, statusText: string, avatar?: string } = { status: 'online', statusText: '', avatar: '' }, passkey?: string, userId?: string, providedTitle?: string) => {
      // Leave existing rooms first
      leaveAllRooms(socket);

      let targetRoomId = roomId;

      // Check bans
      const uid = userId || socket.id;
      if (roomBans[targetRoomId] && roomBans[targetRoomId][uid]) {
        if (roomBans[targetRoomId][uid] > Date.now()) {
          const remainingMin = Math.ceil((roomBans[targetRoomId][uid] - Date.now()) / 60000);
          socket.emit("join-error", { message: `このルームからキックされています。残り${remainingMin}分入室できません。` });
          return;
        } else {
          delete roomBans[targetRoomId][uid];
        }
      }
      
      userInfos[socket.id] = { 
        username, 
        profile, 
        status: statusInfo.status, 
        statusText: statusInfo.statusText,
        avatar: statusInfo.avatar || '',
        uid
      };

      // Auto-assign lobby if no roomId or requested general lobby
      if (!targetRoomId || targetRoomId === "lobby" || targetRoomId === "lobby-request") {
        targetRoomId = findAvailableLobby();
      }

      // Check passkey for private rooms (skip if joining lobby-request which is auto-assigned)
      if (roomMetadata[targetRoomId] && roomMetadata[targetRoomId].isPrivate && targetRoomId !== "lobby" && !targetRoomId.startsWith("lobby-")) {
        if (roomMetadata[targetRoomId].passkey !== passkey) {
           socket.emit("join-error", { message: "合言葉が正しくありません。" });
           return;
        }
      }

      const room = rooms[targetRoomId] || new Set();
      const waitingQueue = roomWaitingQueues[targetRoomId] || [];

      if (room.size >= MAX_USERS_PER_ROOM) {
        if (!waitingQueue.includes(socket.id)) {
          waitingQueue.push(socket.id);
          roomWaitingQueues[targetRoomId] = waitingQueue;
        }
        socket.emit("room-waiting", { roomId: targetRoomId, position: waitingQueue.indexOf(socket.id) + 1 });
        return;
      }

      // If user was in waiting queue, remove them
      if (roomWaitingQueues[targetRoomId]) {
        roomWaitingQueues[targetRoomId] = roomWaitingQueues[targetRoomId].filter(id => id !== socket.id);
      }

      // If it's a dynamic room, ensure shared metadata if it doesn't exist
      if (!roomMetadata[targetRoomId]) {
        console.log(`Setting default metadata for room ${targetRoomId}`);
        roomMetadata[targetRoomId] = {
          id: targetRoomId,
          title: providedTitle || (targetRoomId.startsWith("dynamic-") ? targetRoomId.replace("dynamic-", "Room-") : targetRoomId),
          description: "ルーム説明なし",
          creatorId: socket.id
        };
        broadcastAvailableRooms();
      }

      room.add(socket.id);
      rooms[targetRoomId] = room;
      userCurrentRoom[socket.id] = targetRoomId;
      broadcastAvailableRooms();

      // Init room state if not exists
      if (!roomStates[targetRoomId]) {
        roomStates[targetRoomId] = {
          hostId: socket.id,
          speakers: [],
          queue: [],
        };
      }

      // ENSURE CREATOR IS HOST if they join their own room
      if (roomMetadata[targetRoomId] && roomMetadata[targetRoomId].creatorId === socket.id) {
        roomStates[targetRoomId].hostId = socket.id;
      }

      socket.join(targetRoomId);
      console.log(`${username} joined room: ${targetRoomId}`);

      // Notify others in the room
      socket.to(targetRoomId).emit("user-joined", { 
        userId: socket.id, 
        username, 
        profile,
        status: userInfos[socket.id].status,
        statusText: userInfos[socket.id].statusText,
        avatar: userInfos[socket.id].avatar,
        uid: userInfos[socket.id].uid
      });

      // Tell the new user who else is in the room
      const otherUsersInRoom = Array.from(room).filter(id => id !== socket.id).map(id => ({
        userId: id,
        username: userInfos[id]?.username || "Unknown",
        profile: userInfos[id]?.profile || "",
        status: userInfos[id]?.status || "online",
        statusText: userInfos[id]?.statusText || "",
        avatar: userInfos[id]?.avatar || "",
        uid: userInfos[id]?.uid
      }));
      socket.emit("room-users", otherUsersInRoom);
      socket.emit("joined-room-info", { roomId: targetRoomId, title: roomMetadata[targetRoomId].title });
      broadcastRoomState(targetRoomId);
    });

    socket.on("update-user", ({ username, profile, status, statusText, avatar }: { username: string, profile: string, status: string, statusText: string, avatar: string }) => {
      userInfos[socket.id] = { username, profile, status, statusText, avatar };
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          socket.to(roomId).emit("user-updated", { 
            userId: socket.id, 
            username, 
            profile,
            status,
            statusText,
            avatar
          });
        }
      }
    });

    socket.on("update-profile", ({ username, profile, avatar, status, statusText }: { username: string, profile: string, avatar: string, status?: string, statusText?: string }) => {
      const current = userInfos[socket.id] || { status: 'online', statusText: '', avatar: '' };
      userInfos[socket.id] = { 
        username, 
        profile, 
        status: status || current.status, 
        statusText: statusText || current.statusText, 
        avatar: avatar || current.avatar 
      };
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          socket.to(roomId).emit("user-updated", { 
            userId: socket.id, 
            username, 
            profile,
            status: userInfos[socket.id].status,
            statusText: userInfos[socket.id].statusText,
            avatar: userInfos[socket.id].avatar
          });
        }
      }
    });

    socket.on("request-talk", (roomId: string) => {
      const state = roomStates[roomId];
      if (!state) return;

      if (state.speakers.includes(socket.id) || state.queue.includes(socket.id)) return;

      if (state.speakers.length < 2) {
        state.speakers.push(socket.id);
      } else {
        state.queue.push(socket.id);
      }
      broadcastRoomState(roomId);
    });

    socket.on("release-talk", (roomId: string) => {
      const state = roomStates[roomId];
      if (!state) return;

      state.speakers = state.speakers.filter(id => id !== socket.id);
      state.queue = state.queue.filter(id => id !== socket.id);

      // Fill speaker slots from queue
      while (state.speakers.length < 2 && state.queue.length > 0) {
        const nextId = state.queue.shift();
        if (nextId) state.speakers.push(nextId);
      }
      broadcastRoomState(roomId);
    });

    socket.on("signal", ({ to, from, signal }) => {
      io.to(to).emit("signal", { from, signal });
    });

    socket.on("send-private-message-request", ({ to, fromName }) => {
      io.to(to).emit("private-message-request", { from: socket.id, fromName });
    });

    socket.on("private-message-response", ({ to, accepted, blocked }) => {
      io.to(to).emit("private-message-response", { from: socket.id, accepted, blocked });
    });

    socket.on("send-private-message", ({ to, text, fromName }) => {
      io.to(to).emit("private-message", { senderId: socket.id, senderName: fromName, text, timestamp: Date.now() });
    });

    socket.on("file-offer", ({ to, transfer }) => {
      io.to(to).emit("file-offer", transfer);
    });

    socket.on("file-response", ({ to, transferId, accepted }) => {
      io.to(to).emit("file-response", { transferId, accepted });
    });

    socket.on("file-progress", ({ to, transferId, progress }) => {
      io.to(to).emit("file-progress", { transferId, progress });
    });

    socket.on("file-complete", ({ to, transferId, url }) => {
      io.to(to).emit("file-complete", { transferId, url });
    });

    socket.on("aicha-call", ({ to, fromName }) => {
      io.to(to).emit("aicha-call", { from: socket.id, fromName });
    });

    socket.on("call-handshake-request", ({ to, fromName }) => {
      io.to(to).emit("call-handshake-request", { from: socket.id, fromName });
    });

    socket.on("call-handshake-response", ({ to, accepted, fromName }) => {
      io.to(to).emit("call-handshake-response", { from: socket.id, accepted, fromName });
    });

    socket.on("call-signal", ({ to, signal }) => {
      io.to(to).emit("call-signal", { from: socket.id, signal });
    });

    socket.on("call-ended", ({ to }) => {
      io.to(to).emit("call-ended", { from: socket.id });
    });

    socket.on("file-offer", ({ to, transfer }) => {
      io.to(to).emit("file-offer", transfer);
    });

    socket.on("file-response", ({ to, transferId, accepted }) => {
      io.to(to).emit("file-response", { transferId, accepted });
    });

    socket.on("file-progress", ({ to, transferId, progress }) => {
      io.to(to).emit("file-progress", { transferId, progress });
    });

    socket.on("file-complete", ({ to, transferId, url }) => {
      io.to(to).emit("file-complete", { transferId, url });
    });

    socket.on("chat-message", (roomId: string, msg: any) => {
      socket.to(roomId).emit("chat-message", msg);
    });

    socket.on("sukucha-toggle", ({ roomId, active }) => {
      const state = roomStates[roomId];
      if (state) {
        state.sukuchaActive = active;
        broadcastRoomState(roomId);
      }
      socket.to(roomId).emit("sukucha-toggle", { active, senderId: socket.id });
    });

    socket.on("sukucha-video-change", ({ roomId, videoId }) => {
      const state = roomStates[roomId];
      if (state) {
        state.sukuchaVideoId = videoId;
        broadcastRoomState(roomId);
      }
      socket.to(roomId).emit("sukucha-video-change", { videoId, senderId: socket.id });
    });

    socket.on("sukucha-sync", ({ roomId, videoId, action, time }) => {
      socket.to(roomId).emit("sukucha-sync", { videoId, action, time, timestamp: Date.now() });
    });

    socket.on("trigger-cracker", (roomId: string) => {
      socket.to(roomId).emit("receive-cracker", { fromId: socket.id });
    });

    socket.on("friend-request", ({ to }: { to: string }) => {
      const fromInfo = userInfos[socket.id] || { username: "不明なユーザー", profile: "" };
      io.to(to).emit("receive-friend-request", {
        from: socket.id,
        fromName: fromInfo.username
      });
    });

    socket.on("friend-response", ({ to, accepted }: { to: string, accepted: boolean }) => {
      const fromInfo = userInfos[socket.id] || { username: "不明なユーザー", profile: "" };
      io.to(to).emit("friend-response-result", {
        from: socket.id,
        fromName: fromInfo.username,
        accepted
      });
      
      if (accepted) {
        // Notify both parties that they are now friends
        socket.emit("add-to-friend-list", { id: to, info: userInfos[to] });
        io.to(to).emit("add-to-friend-list", { id: socket.id, info: fromInfo });
      }
    });

    socket.on("send-heart", ({ to }) => {
      userHearts[to] = (userHearts[to] || 0) + 1;
      io.to(to).emit("heart-received", { from: socket.id, count: userHearts[to] });
      // Notify the room about the heart count change if needed, or just let users query it
      io.emit("update-hearts", { userId: to, count: userHearts[to] });
    });

    socket.on("get-user-hearts", (userId: string) => {
      socket.emit("user-hearts", { userId, count: userHearts[userId] || 0 });
    });

    socket.on("get-user-room", (targetId: string) => {
      const roomId = userCurrentRoom[targetId];
      if (roomId && roomMetadata[roomId]) {
        socket.emit("user-room-info", { userId: targetId, roomId, title: roomMetadata[roomId].title });
      } else {
        socket.emit("user-room-info", { userId: targetId, roomId: null });
      }
    });

    socket.on("kick-user", ({ roomId, targetUserId, targetUid, durationMin }: { roomId: string, targetUserId: string, targetUid?: string, durationMin: number }) => {
      const room = roomMetadata[roomId];
      const state = roomStates[roomId];
      if (!room || !state) return;

      // Only host or admin (creator) can kick
      if (state.hostId === socket.id || room.creatorId === socket.id) {
        const targetSocket = io.sockets.sockets.get(targetUserId);
        const banUid = targetUid || targetUserId;

        if (!roomBans[roomId]) roomBans[roomId] = {};
        roomBans[roomId][banUid] = Date.now() + (durationMin * 60 * 1000);

        if (targetSocket) {
          targetSocket.emit("kicked", { roomId, reason: `ホストによって${durationMin}分間キックされました。` });
          targetSocket.leave(roomId);
          // Auto join lobby or something? Better to let client handle it.
        }
        
        // Also cleanup room if they were in it
        if (rooms[roomId]) {
          rooms[roomId].delete(targetUserId);
          io.to(roomId).emit("user-left", targetUserId);
          broadcastAvailableRooms();
        }
      }
    });
    
    socket.on("create-room", ({ title, description, isPrivate, passkey, roomId: providedRoomId }: { title: string, description: string, isPrivate?: boolean, passkey?: string, roomId?: string }) => {
      // Find and remove any existing dynamic room created by this user
      const existingRoomId = Object.keys(roomMetadata).find(id => 
        roomMetadata[id].creatorId === socket.id && id.startsWith("dynamic-")
      );

      if (existingRoomId) {
        console.log(`User ${socket.id} replacing old room ${existingRoomId}`);
        // Notify users in the old room that it's closing
        io.to(existingRoomId).emit("room-closed", { reason: "host_replaced_room" });
        
        // Clean up metadata and state
        delete roomMetadata[existingRoomId];
        delete roomStates[existingRoomId];
        delete rooms[existingRoomId];
        
        // Force all sockets in the old room to leave
        const clients = io.sockets.adapter.rooms.get(existingRoomId);
        if (clients) {
          for (const clientId of clients) {
            const clientSocket = io.sockets.sockets.get(clientId);
            if (clientSocket) {
              clientSocket.leave(existingRoomId);
            }
          }
        }
      }

      const roomId = providedRoomId || `dynamic-${Math.random().toString(36).substring(2, 7)}`;
      roomMetadata[roomId] = {
        id: roomId,
        title,
        description,
        creatorId: socket.id,
        isPrivate: !!isPrivate,
        passkey: passkey || ''
      };

      // Pre-initialize room state with creator as host
      roomStates[roomId] = {
        hostId: socket.id,
        speakers: [],
        queue: [],
      };

      broadcastAvailableRooms();
      socket.emit("room-created", { roomId, title });
    });

    socket.on("invite-user", ({ to, roomId, roomTitle }: { to: string, roomId: string, roomTitle: string }) => {
      const fromName = userInfos[socket.id]?.username || "誰か";
      io.to(to).emit("receive-invite", { from: socket.id, fromName, roomId, roomTitle });
    });

    socket.on("search-online-users", (query: string) => {
      const q = query.toLowerCase();
      const results = Object.entries(userInfos)
        .filter(([id, info]) => {
          return info.username.toLowerCase().includes(q);
        })
        .map(([id, info]) => ({
          id,
          username: info.username,
          profile: info.profile,
          avatar: info.avatar,
          status: info.status
        }));

      // Add AiCha (System Bot) to results if query matches
      if ("あいちゃ".includes(q) || "aicha".includes(q)) {
        results.push({
          id: 'test-user-aicha',
          username: 'あいちゃ',
          profile: 'あいちゃ2.0 AIアシスタント',
          avatar: '',
          status: 'online'
        });
      }

      socket.emit("search-results", results);
    });

    socket.on("disconnecting", () => {
      leaveAllRooms(socket);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      delete userInfos[socket.id];
      // Cleanup waiting queues
      Object.keys(roomWaitingQueues).forEach(roomId => {
        roomWaitingQueues[roomId] = roomWaitingQueues[roomId].filter(id => id !== socket.id);
      });
    });
  });

  // Vite server integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
