"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { socket } from "../lib/socket";

const EMOJIS = ["👍","❤️","😂","😮","😢","🔥","🎉","👏","🙌","💯"];
const QUICK_EMOJIS = ["😊","😂","❤️","👍","🔥","🎉","😮","😢","🙏","💪","👏","🤔","😎","✨","🥳","💬"];

// room label → socket room key
const ROOMS = [
  { label: "# general",       key: "general" },
  { label: "# random",        key: "random" },
  { label: "# tech-talk",     key: "tech-talk" },
  { label: "# announcements", key: "announcements" },
];

export default function ChatRoom({
  username,
  messages,
  message,
  setMessage,
  sendMessage,
  onlineUsers = [],
  activeRoom,
  onRoomChange,
  roomLoading,
}) {
  const bottomRef    = useRef(null);
  const textareaRef  = useRef(null);
  const messagesRef  = useRef(null);   // scrollable messages container
  const msgRefs      = useRef({});     // { msgId -> DOM element }
  const router       = useRouter();

  const [showEmoji,   setShowEmoji]   = useState(false);
  const [reactions,   setReactions]   = useState({});
  const [isTyping,    setIsTyping]    = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [hoveredMsg,  setHoveredMsg]  = useState(null);
  const [replyingTo,  setReplyingTo]  = useState(null);
  const [highlighted, setHighlighted] = useState(null); // msgId being highlighted
  const typingTimeout = useRef(null);

  // ── Auto scroll to bottom on new messages ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Reset state when room changes ──
  useEffect(() => {
    setReplyingTo(null);
    setShowEmoji(false);
    setReactions({});
    setTypingUsers([]);
  }, [activeRoom]);

  // ── Typing indicator socket ──
  useEffect(() => {
    const handleTyping = (data) => {
      if (data.user === username) return;
      setTypingUsers((prev) =>
        prev.includes(data.user) ? prev : [...prev, data.user]
      );
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== data.user));
      }, 2500);
    };
    socket.on("user_typing", handleTyping);
    return () => socket.off("user_typing", handleTyping);
  }, [username]);

  // ── Textarea auto-grow ──
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "22px";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  }, [message]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { user: username, room: activeRoom });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setIsTyping(false), 1800);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && message.trim()) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!message.trim()) return;
    // Pass replyTo with _id so scroll works
    sendMessage(
      replyingTo
        ? {
            replyTo: {
              _id:    replyingTo._id,
              author: replyingTo.author,
              text:   replyingTo.text,
            },
          }
        : {}
    );
    setReplyingTo(null);
    setShowEmoji(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    socket.disconnect();
    router.push("/login");
  };

  const addReaction = (msgId, emoji) => {
    setReactions((prev) => {
      const cur = prev[msgId] || {};
      return { ...prev, [msgId]: { ...cur, [emoji]: (cur[emoji] || 0) + 1 } };
    });
    setHoveredMsg(null);
  };

  const insertEmoji = (emoji) => {
    setMessage((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  // ── SCROLL TO ORIGINAL MESSAGE ON REPLY CLICK ──
  const scrollToMessage = (replyToId) => {
    if (!replyToId) return;

    const el = msgRefs.current[replyToId];
    if (!el) return;

    // Smooth scroll inside messages container
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Highlight flash effect
    setHighlighted(replyToId);
    setTimeout(() => setHighlighted(null), 1800);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  // Group messages by date
  const grouped = messages.reduce((acc, msg) => {
    const label = msg.createdAt ? formatDate(msg.createdAt) : "Today";
    if (!acc[label]) acc[label] = [];
    acc[label].push(msg);
    return acc;
  }, {});

  const activeRoomLabel =
    ROOMS.find((r) => r.key === activeRoom)?.label || `# ${activeRoom}`;

  return (
    <div className="chat-layout">

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-icon">💬</div>
            <span className="sidebar-title">NexChat</span>
          </div>
        </div>

        <div className="sidebar-content">
          <p className="sidebar-section-title">Rooms</p>
          {ROOMS.map((room) => (
            <div
              key={room.key}
              className={`room-item ${room.key === activeRoom ? "active" : ""}`}
              onClick={() => onRoomChange(room.key)}
            >
              <span className="room-item-icon">💬</span>
              <span className="room-item-name">{room.label}</span>
            </div>
          ))}
        </div>

        <div className="online-users">
          <p className="sidebar-section-title" style={{ padding: "0 4px", marginBottom: "10px" }}>
            Online — {onlineUsers.length || 1}
          </p>
          <div className="user-pill">
            <div className="avatar-wrap">
              <div className="avatar">{username?.[0]?.toUpperCase() || "U"}</div>
              <div className="online-dot" />
            </div>
            <span className="user-name">{username} (you)</span>
          </div>
          {onlineUsers.filter((u) => u !== username).map((u) => (
            <div key={u} className="user-pill">
              <div className="avatar-wrap">
                <div className="avatar">{u[0]?.toUpperCase()}</div>
                <div className="online-dot" />
              </div>
              <span className="user-name">{u}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main Chat ── */}
      <div className="chat-main">

        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="avatar-wrap">
              <div className="avatar lg">{username?.[0]?.toUpperCase() || "U"}</div>
              <div className="online-dot" style={{ border: "2px solid var(--bg-secondary)" }} />
            </div>
            <div>
              <div className="chat-header-name">{activeRoomLabel}</div>
              <div className="chat-header-status">Active now</div>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-btn" title="Search">🔍</button>
            <button className="icon-btn" title="Members">👥</button>
            <button className="icon-btn" title="Notifications">🔔</button>
            <button
              className="icon-btn"
              onClick={handleLogout}
              title="Logout"
              style={{ color: "#ef4444" }}
            >
              🚪
            </button>
          </div>
        </div>

        {/* ── Messages Area ── */}
        <div className="messages-area" ref={messagesRef}>

          {/* Room loading spinner */}
          {roomLoading && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "10px", padding: "40px", color: "var(--text-muted)", fontSize: "13px",
            }}>
              <div style={{
                width: "16px", height: "16px",
                border: "2px solid var(--border)",
                borderTop: "2px solid var(--accent-primary)",
                borderRadius: "50%",
                animation: "spinSlow 0.8s linear infinite",
              }} />
              Loading messages…
            </div>
          )}

          {/* Empty room state */}
          {!roomLoading && messages.length === 0 && (
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              flex: 1, gap: "12px", padding: "60px 20px",
              color: "var(--text-muted)", fontSize: "14px", textAlign: "center",
            }}>
              <div style={{ fontSize: "40px" }}>💬</div>
              <div style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                No messages yet in {activeRoomLabel}
              </div>
              <div style={{ fontSize: "13px" }}>Be the first to say something!</div>
            </div>
          )}

          {!roomLoading && Object.entries(grouped).map(([date, msgs]) => (
            <div key={date}>
              <div className="date-divider"><span>{date}</span></div>

              {msgs.map((msg) => {
                const isOwn      = msg.author === username;
                const msgId      = msg._id || msg.id || String(msg.createdAt);
                const msgReacts  = reactions[msgId] || {};
                const isHighlighted = highlighted === msgId;

                return (
                  <div
                    key={msgId}
                    // ── Assign ref so scroll-to works ──
                    ref={(el) => { if (el) msgRefs.current[msgId] = el; }}
                    className={`msg-wrapper ${isOwn ? "own" : "other"}`}
                    style={{
                      marginBottom: "10px",
                      // Flash highlight when scrolled-to
                      transition: "background 0.3s ease",
                      background: isHighlighted
                        ? "rgba(108,99,255,0.12)"
                        : "transparent",
                      borderRadius: "12px",
                      padding: isHighlighted ? "4px 8px" : "0",
                    }}
                    onMouseEnter={() => setHoveredMsg(msgId)}
                    onMouseLeave={() => setHoveredMsg(null)}
                  >
                    {!isOwn && (
                      <div className="msg-meta">
                        <div className="avatar" style={{ width: "22px", height: "22px", fontSize: "10px" }}>
                          {msg.author?.[0]?.toUpperCase() || "U"}
                        </div>
                        <span className="msg-author">{msg.author}</span>
                      </div>
                    )}

                    <div style={{ position: "relative", display: "inline-block", maxWidth: "68%" }}>

                      {/* Hover reaction picker */}
                      {hoveredMsg === msgId && (
                        <div className="msg-actions">
                          {EMOJIS.slice(0, 6).map((emoji) => (
                            <button
                              key={emoji}
                              className="react-btn"
                              onClick={() => addReaction(msgId, emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                          <button
                            className="react-btn"
                            title="Reply"
                            onClick={() => setReplyingTo(msg)}
                          >
                            ↩️
                          </button>
                        </div>
                      )}

                      
                      {msg.replyTo?.text && (
                        <div
                          onClick={() => scrollToMessage(msg.replyTo._id)}
                          style={{
                            background: isOwn
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(108,99,255,0.1)",
                            borderLeft: "3px solid var(--accent-secondary)",
                            padding: "6px 10px",
                            borderRadius: "8px 8px 0 0",
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            marginBottom: "2px",
                            cursor: "pointer",
                            transition: "background 0.15s ease",
                            userSelect: "none",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = isOwn
                              ? "rgba(255,255,255,0.18)"
                              : "rgba(108,99,255,0.18)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = isOwn
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(108,99,255,0.1)")
                          }
                        >
                          <span style={{ color: "var(--accent-secondary)", fontWeight: 600 }}>
                            ↩ {msg.replyTo.author}
                          </span>
                          <br />
                          <span style={{ opacity: 0.8 }}>
                            {msg.replyTo.text?.slice(0, 80)}
                            {msg.replyTo.text?.length > 80 ? "…" : ""}
                          </span>
                        </div>
                      )}

                      <div className="msg-bubble">{msg.text}</div>
                    </div>

                    <div className="msg-time">
                      <span>{msg.time}</span>
                      {isOwn && <span className="msg-status">✓✓</span>}
                    </div>

                    {/* Reactions */}
                    {Object.keys(msgReacts).length > 0 && (
                      <div className="msg-reactions">
                        {Object.entries(msgReacts).map(([emoji, count]) => (
                          <div
                            key={emoji}
                            className="reaction-badge"
                            onClick={() => addReaction(msgId, emoji)}
                          >
                            {emoji}
                            {count > 1 && <span className="reaction-count">{count}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span /><span /><span />
            </div>
            <span className="typing-text">
              {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…
            </span>
          </div>
        )}

        {/* ── Input Area ── */}
        <div className="input-area" style={{ position: "relative" }}>

          {/* Reply Banner */}
          {replyingTo && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(108,99,255,0.1)",
              border: "1px solid rgba(108,99,255,0.2)",
              borderRadius: "10px",
              padding: "8px 14px",
              marginBottom: "10px",
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}>
              <span>
                ↩ Replying to{" "}
                <strong style={{ color: "var(--accent-secondary)" }}>
                  {replyingTo.author}
                </strong>
                : {replyingTo.text?.slice(0, 50)}
                {replyingTo.text?.length > 50 ? "…" : ""}
              </span>
              <button
                onClick={() => setReplyingTo(null)}
                style={{
                  background: "none", border: "none",
                  cursor: "pointer", color: "var(--text-muted)", fontSize: "16px",
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Emoji Picker */}
          {showEmoji && (
            <div
              className="emoji-picker"
              style={{ marginBottom: "8px", position: "relative", bottom: "auto", left: "auto" }}
            >
              {QUICK_EMOJIS.map((e) => (
                <button key={e} className="emoji-btn" onClick={() => insertEmoji(e)}>
                  {e}
                </button>
              ))}
            </div>
          )}

          <div className="input-wrapper">
            <button
              className="toolbar-btn"
              onClick={() => setShowEmoji(!showEmoji)}
              title="Emoji"
            >
              😊
            </button>

            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder={`Message ${activeRoomLabel}…`}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
            />

            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!message.trim()}
              title="Send"
            >
              ➤
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
