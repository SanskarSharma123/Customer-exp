import React, { useState, useRef, useEffect } from 'react';
import '../css/Chatbot.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from "../contexts/ThemeContext";


const Chatbot = () => {
  const { toggleDarkMode } = useTheme();

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };
const handleSendMessage = async (e) => {
  e.preventDefault();
  if (inputMessage.trim() === '') return;

  const userMessage = {
    id: Date.now(),
    text: inputMessage,
    sender: 'user',
    timestamp: new Date()
  };

  setMessages(prev => [...prev, userMessage]);
  setInputMessage('');
  setIsTyping(true);

  try {
    const res = await axios.post("http://localhost:8000/api/intent", {
      message: userMessage.text
    });


if (res.data.action === "open_tab" && res.data.url) {
    
    const urlObj = new URL(res.data.url);
    const categoryParam = urlObj.searchParams.get("category");

    // Navigate internally without reload
    navigate(`/products?category=${categoryParam}`);

    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      text: "Opening category page...",
      sender: 'bot',
      timestamp: new Date()
    }]);
}
    else if (res.data.response) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: res.data.response,
        sender: 'bot',
        timestamp: new Date()
      }]);
    }

    else if (res.data.action === "switch_mode") {
        toggleDarkMode();
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: "Switching theme mode...",
          sender: 'bot',
          timestamp: new Date()
        }]);
      } 


    else if (res.data.intent) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: `Intent detected: ${res.data.intent}`,
        sender: 'bot',
        timestamp: new Date()
      }]);
    }
    else if (res.data.error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: `Error: ${res.data.error}`,
        sender: 'bot',
        timestamp: new Date()
      }]);
    }
    else {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "I'm not sure how to respond to that.",
        sender: 'bot',
        timestamp: new Date()
      }]);
    }

  } catch (err) {
    console.error(err);
    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      text: "Error communicating with server.",
      sender: 'bot',
      timestamp: new Date()
    }]);
  } finally {
    setIsTyping(false);
  }
};

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="bot-avatar">💬</div>
            <div>
              <h4>Chat Support</h4>
              <span className="status">Online</span>
            </div>
          </div>
          <button className="close-btn" onClick={toggleChatbot}>
            ✕
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <p>Start a conversation...</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender === 'user' ? 'user' : 'bot'}`}
            >
              <div className="message-content">
                <p dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br/>') }}></p>
                <span className="message-time">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message bot">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chatbot-input" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isTyping}
          />
          <button type="submit" disabled={isTyping || inputMessage.trim() === ''}>
            ➤
          </button>
        </form>
      </div>

      <div className="chatbot-toggle" onClick={toggleChatbot}>
        <div className="chat-icon">
          {isOpen ? '✕' : '💬'}
        </div>
        {!isOpen && messages.length > 0 && (
          <div className="notification-badge">{messages.length}</div>
        )}
      </div>
    </>
  );
};

export default Chatbot;
