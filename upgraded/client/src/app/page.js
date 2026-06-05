"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ChatRoom from "./components/ChatRoom";
import axios from "axios";
import { socket } from "./lib/socket";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeRoom, setActiveRoom] = useState("general");
  const [roomLoading, setRoomLoading] = useState(false);

  // ── Auth check ──
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      router.replace("/login");
      return;
    }
    setUser(JSON.parse(userData));
    setLoading(false);
  }, [router]);

  // ── Socket setup (once user is set) ──
  useEffect(() => {
    if (!user) return;

    socket.connect();
    socket.emit("user_join", user.username);

    const handleOnlineUsers = (users) => setOnlineUsers(users);
    socket.on("online_users", handleOnlineUsers);

    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.disconnect();
    };
  }, [user]);

  // ── Fetch messages + join room whenever activeRoom changes ──
  useEffect(() => {
    if (!user) return;

    const switchRoom = async () => {
      setRoomLoading(true);
      setMessages([]);

      // Tell server to switch socket room
      socket.emit("join_room", { room: activeRoom, username: user.username });

      // Remove old receive_message listener and add fresh one
      socket.off("receive_message");
      socket.on("receive_message", (data) => {
        setMessages((prev) => [...prev, data]);
      });

      // Fetch existing messages for this room
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/messages?room=${activeRoom}`
        );
        setMessages(res.data);
      } catch (error) {
        console.log("Fetch error:", error);
      } finally {
        setRoomLoading(false);
      }
    };

    switchRoom();

    return () => {
      socket.off("receive_message");
    };
  }, [user, activeRoom]);

  // ── Send message ──
  const sendMessage = useCallback(
    (extra = {}) => {
      if (!message.trim() || !user) return;

      const data = {
        author: user.username,
        text: message,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        room: activeRoom,
        ...extra,
      };

      socket.emit("send_message", data);
      setMessage("");
    },
    [message, user, activeRoom]
  );

  // ── Room switch handler (passed to ChatRoom) ──
  const handleRoomChange = useCallback((room) => {
    setActiveRoom(room);
    setMessage("");
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
          color: "var(--text-secondary)",
          fontFamily: "var(--font-main)",
          fontSize: "14px",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "20px",
            height: "20px",
            border: "2px solid var(--border)",
            borderTop: "2px solid var(--accent-primary)",
            borderRadius: "50%",
            animation: "spinSlow 0.8s linear infinite",
          }}
        />
        Loading NexChat…
      </div>
    );
  }

  return (
    <ChatRoom
      username={user.username}
      messages={messages}
      message={message}
      setMessage={setMessage}
      sendMessage={sendMessage}
      onlineUsers={onlineUsers}
      activeRoom={activeRoom}
      onRoomChange={handleRoomChange}
      roomLoading={roomLoading}
    />
  );
}
