// TODO List:
/*
    Mô tả: đây là chat bot nơi người dùng có thể sử dụng để tìm kiếm thông tin và tương tác với hệ thống:
    Các chức năng chính:
    - Truy cập các thông tin dữ liệu từ hệ thống
    - Tương tác với hệ thống, có thể điều khiển hệ thống như mở mái che, tưới nước, bật tắt đèn, v.v.
    - Tìm kiếm thông tin
    - Trả lời câu hỏi của người dùng, ví dụ như nhiệt độ độ ẩm hiện tại của môi trường, cây trồng nào sắp thu hoạch, và hệ thống có ổn định không
    - Người dùng có thể tự do chat với hệ thống và hệ thống sẽ trả lời lại kèm thông tin chi tiết
    Giao diện:
    - Chat bot sẽ hiển thị ở góc dưới bên phải của trang web với icon hình khung chat
    - Khi bấm vào icon 1 khung nhỏ sẽ mở lên và người dùng có thể nhập tin nhắn vào đó
    - Khi người dùng nhập tin nhắn và gửi đi, hệ thống sẽ trả lời lại và hiển thị tin nhắn đó ở khung chat
    - Có thể cuộn lên xuống để xem các tin nhắn trước đó
    Lưu trữ dữ liệu:
    - Dữ liệu chat giữa người dùng và hệ thống sẽ được lưu trữ trong cơ sở dữ liệu
    - Dữ liệu sẽ được gọi thông qua API

*/

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import "./chatbot.css";
import { FaRobot, FaCommentDots, FaPaperPlane, FaTimes } from "react-icons/fa";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userId, setUserId] = useState("");
  const messagesEndRef = useRef(null);

  // Tạo hoặc lấy userId từ localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("smartfarm_user_id");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = uuidv4();
      localStorage.setItem("smartfarm_user_id", newUserId);
      setUserId(newUserId);
    }
  }, []);

  // Cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Lấy lịch sử chat khi component mount
  useEffect(() => {
    if (userId) {
      fetchChatHistory();
    }
  }, [userId]);

  const fetchChatHistory = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/chat/history/${userId}`);
      if (response.data && Array.isArray(response.data)) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;

    // Thêm tin nhắn của người dùng vào danh sách
    const userMessage = {
      id: Date.now(),
      user_id: userId,
      message: message,
      is_bot: 0,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsTyping(true);

    try {
      // Gửi tin nhắn đến server
      const response = await axios.post("http://localhost:5000/api/chat", {
        message: message,
        userId: userId
      });

      setIsTyping(false);

      // Thêm tin nhắn của bot vào danh sách
      const botMessage = {
        id: response.data.messageId,
        user_id: userId,
        message: response.data.response,
        is_bot: 1,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setIsTyping(false);
      console.error("Error sending message:", error);

      // Thêm tin nhắn lỗi
      const errorMessage = {
        id: Date.now(),
        user_id: userId,
        message: "Xin lỗi, tôi đang gặp vấn đề kết nối. Vui lòng thử lại sau.",
        is_bot: 1,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="chatbot-container">
      {/* Icon để mở chatbot */}
      {!isOpen && (
        <div className="chatbot-button" onClick={toggleChat}>
          <FaCommentDots />
        </div>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <FaRobot className="robot-icon" />
              <span>SmartFarm Assistant</span>
            </div>
            <button className="close-button" onClick={toggleChat}>
              <FaTimes />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="welcome-message">
                <p>Xin chào! Tôi là trợ lý SmartFarm. Tôi có thể giúp bạn truy vấn thông tin về hệ thống và điều khiển các thiết bị. Hãy hỏi tôi bất cứ điều gì!</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.is_bot ? "bot-message" : "user-message"}`}
              >
                {msg.is_bot && <FaRobot className="message-icon" />}
                <div className="message-content">{msg.message}</div>
              </div>
            ))}

            {isTyping && (
              <div className="message bot-message typing">
                <FaRobot className="message-icon" />
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <textarea
              placeholder="Nhập tin nhắn..."
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              rows={1}
            />
            <button onClick={handleSubmit} disabled={!message.trim()}>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;