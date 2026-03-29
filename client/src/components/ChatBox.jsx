import React, { useState, useEffect, useRef } from "react";
import socket from "../socket";

function ChatBox({ room, playerName }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const chatBodyRef = useRef(null);

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit("send_message", {
        roomId: room.id,
        name: playerName,
        message,
      });
      setMessage("");
    }
  };

  return (
    <div className="chat-box">
      <div className="chat-body" ref={chatBodyRef}>
        {messages.map((msg, index) => (
          <div key={index} className="chat-message">
            <strong>{msg.name}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="chat-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatBox;
