import React, { useState, useRef, useEffect, useMemo, Routes,Route } from 'react';
import '../css/Chatbot.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from "../contexts/ThemeContext";
import Cart from '../pages/Cart';

<Routes>
  {/* other routes */}
  <Route path="/cart" element={<Cart />} />
</Routes>
const Chatbot = () => {

  const { toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [voiceEnabled, setVoiceEnabled] = useState(true);  // Voice enabled by default

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceInputStatus, setVoiceInputStatus] = useState(''); // For status messages
  const messagesEndRef = useRef(null);

  // Memoize speech recognizer initialization to prevent re-creation on every render
  const speechRecognizer = useMemo(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return SpeechRecognition ? new SpeechRecognition() : null;
  }, []);

  const currentSpeechRef = useRef(null); // Track current speech synthesis

  // Enhanced voice input configuration
  useEffect(() => {
    if (speechRecognizer) {
      speechRecognizer.continuous = false;
      speechRecognizer.interimResults = true;
      speechRecognizer.lang = 'en-IN';
      speechRecognizer.maxAlternatives = 1;
    }
  }, [speechRecognizer]);

  const startListening = () => {
  if (!speechRecognizer) {
    setVoiceInputStatus("Speech Recognition not supported in your browser");
    setTimeout(() => setVoiceInputStatus(''), 3000);
    return;
  }

  // Stop any ongoing speech first
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  // Clear previous input and reset states
  setInputMessage('');
  setIsListening(true);
  setVoiceInputStatus("Initializing microphone...");
  
  // Add a small delay to ensure UI updates before starting
  setTimeout(() => {
    try {
      // Configure speech recognizer before each use
      speechRecognizer.continuous = false; // Changed to false for better control
      speechRecognizer.interimResults = true;
      speechRecognizer.lang = 'en-IN';
      speechRecognizer.maxAlternatives = 1;

      let hasReceivedSpeech = false; // Track if we've received any speech
      let finalTranscript = '';

      // Set up event handlers
      speechRecognizer.onstart = () => {
        console.log("Speech recognition started");
        setVoiceInputStatus("Listening... Speak now");
      };

      speechRecognizer.onresult = (event) => {
        hasReceivedSpeech = true; // Mark that we've received speech
        let interimTranscript = '';
        finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Update input with interim + final transcript
        setInputMessage(finalTranscript + interimTranscript);
        
        if (finalTranscript) {
          setVoiceInputStatus("Processing voice input...");
        } else {
          setVoiceInputStatus("Listening... (processing speech)");
        }
      };

      speechRecognizer.onend = () => {
        console.log("Speech recognition ended");
        setIsListening(false);
        
        if (finalTranscript.trim() || inputMessage.trim()) {
          setVoiceInputStatus("Voice input captured successfully!");
          setTimeout(() => setVoiceInputStatus(''), 2000);
        } else if (hasReceivedSpeech) {
          // If we received speech but no final transcript, try to restart once
          setVoiceInputStatus("Continuing to listen...");
          setTimeout(() => {
            if (!isListening) { // Only restart if not currently listening
              startListening();
            }
          }, 500);
        } else {
          setVoiceInputStatus("Please speak clearly and try again.");
          setTimeout(() => setVoiceInputStatus(''), 3000);
        }
      };

      speechRecognizer.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        
        let errorMessage = "Voice input error";
        switch (event.error) {
          case 'network':
            errorMessage = "Network error - check connection";
            break;
          case 'not-allowed':
            errorMessage = "Microphone access denied. Please allow microphone access.";
            break;
          case 'no-speech':
            // Don't treat no-speech as a hard error, just restart
            if (!hasReceivedSpeech) {
              setVoiceInputStatus("No speech detected. Trying again...");
              setTimeout(() => {
                if (!isListening) {
                  startListening();
                }
              }, 1000);
              return;
            }
            errorMessage = "No speech detected. Please speak clearly.";
            break;
          case 'audio-capture':
            errorMessage = "Microphone not available";
            break;
          case 'aborted':
            errorMessage = "Voice input was stopped";
            break;
          default:
            errorMessage = `Voice error: ${event.error}`;
        }
        
        setVoiceInputStatus(errorMessage);
        setTimeout(() => setVoiceInputStatus(''), 4000);
      };

      // Start recognition
      speechRecognizer.start();

      // Auto-stop listening after 10 seconds (reduced timeout)
      setTimeout(() => {
        if (speechRecognizer && isListening) {
          console.log("Auto-stopping speech recognition due to timeout");
          speechRecognizer.stop();
        }
      }, 10000);

    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setIsListening(false);
      setVoiceInputStatus("Failed to start voice input");
      setTimeout(() => setVoiceInputStatus(''), 3000);
    }
  }, 100);
};

  const speak = (text) => {
    // Immediately stop if voice is disabled
    if (!voiceEnabled) return;

    const synth = window.speechSynthesis;

    if (synth.speaking) synth.cancel();  // Stop ongoing speech instantly

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    // Store reference to current speech
    currentSpeechRef.current = utterance;
    
    utterance.onend = () => {
      currentSpeechRef.current = null;
    };
    
    utterance.onerror = () => {
      currentSpeechRef.current = null;
    };
    
    synth.speak(utterance);
  };

  const toggleVoiceEnabled = () => {
    const newVoiceState = !voiceEnabled;
    setVoiceEnabled(newVoiceState);
    
    // If disabling voice, immediately stop any current speech
    if (!newVoiceState && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      currentSpeechRef.current = null;
    }
    
    // Show feedback
    setVoiceInputStatus(newVoiceState ? "Voice enabled" : "Voice disabled");
    setTimeout(() => setVoiceInputStatus(''), 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addBotMessage = (text, isHtml = false) => {
    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      text: text,
      sender: 'bot',
      timestamp: new Date(),
      isHtml: isHtml
    }]);

    // Only speak if voice is currently enabled
    if (!voiceEnabled) return;

    // Clean and prepare text for speech
    let plainText = text
      .replace(/<br\s*\/?>/gi, '. ') // Replace <br> with pause
      .replace(/<[^>]*>/g, '')      // Remove all remaining HTML tags
      .replace(/\n/g, '. ')         // Newlines become pause
      .replace(/,+/g, ', ')         // Ensure commas have spacing
      .replace(/\s{2,}/g, ' ')      // Remove extra spaces
      .trim();

    if (plainText) speak(plainText);
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    // Stop any ongoing speech when closing chatbot
    if (!isOpen === false && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === '') return;

    // Clear voice input status when sending message
    setVoiceInputStatus('');

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
      }, { withCredentials: true });

      if (res.data.action === "open_tab" && res.data.url) {
        const urlObj = new URL(res.data.url);
        const categoryParam = urlObj.searchParams.get("category");
        navigate(`/products?category=${categoryParam}`);
        addBotMessage("Opening category page...");
      }

      else if (res.data.action === "category_listing") {
        const categories = res.data.categories || [];
        if (categories.length === 0) {
          addBotMessage("No categories available at the moment.");
        } else {
          const categoryText = categories.map(cat => `<strong>${cat}</strong>`).join('<br>');
          const fullMessage = `<strong>Here are the available categories:</strong><br><br>${categoryText}<br><br>Can you please tell me more specifically which category you're interested in?`;
          addBotMessage(fullMessage, true);
        }
      }
else if (res.data.action === "greet") {
  addBotMessage(res.data.response || "Hello! How can I help you today?");
}
  else if (res.data.action === "show_products" && res.data.products) {
      addBotMessage("Here are the products matching your query.");

      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        products: res.data.products,
        sender: 'bot',
        timestamp: new Date()
      }]);
  }

      else if (res.data.action === "add_to_cart_success") {
        addBotMessage("Item added to cart successfully!");
        localStorage.setItem("cart_updated", Date.now());
        window.dispatchEvent(new Event("cart_updated_manual"));
      }

      else if (res.data.action === "add_to_cart_failed") {
        addBotMessage("Failed to add item to cart. Please try again.");
      }

      else if (res.data.action === "cart_item_updated") {
        addBotMessage("Cart item quantity updated!");
        localStorage.setItem("cart_updated", Date.now());
        window.dispatchEvent(new Event("cart_updated_manual"));
      }

      else if (res.data.action === "cart_update_failed") {
        addBotMessage("Failed to update cart item.");
      }

      else if (res.data.action === "cart_item_removed") {
        addBotMessage("Item removed from cart.");
        localStorage.setItem("cart_updated", Date.now());
        window.dispatchEvent(new Event("cart_updated_manual"));
      }

      else if (res.data.action === "cart_remove_failed") {
        addBotMessage("Failed to remove item from cart.");
      }

      else if (res.data.action === "open_product_page" && res.data.product) {
        const product = res.data.product;
        const productDetails = `Product Details:\nName: ${product.name}\nPrice: ₹${product.price}\nRating: ${product.average_rating} ⭐ (${product.review_count} reviews)\nDescription: ${product.description}`;
        addBotMessage(productDetails);
        if (product.product_id) {
          navigate(`/products/${product.product_id}`);
        }
      }

      else if (res.data.action === "product_not_found") {
        addBotMessage("Sorry, the product was not found.");
      }

      else if (res.data.action === "product_details_failed") {
        addBotMessage("Unable to fetch product details. Please try again.");
      }
      else if (res.data.action === "order_notification_sent") {
        addBotMessage("Order placed successfully");
      }

      else if (res.data.action === "order_success") {
        addBotMessage(res.data.response);
        localStorage.setItem("cart_updated", Date.now());
        window.dispatchEvent(new Event("cart_updated_manual"));
      }

      else if (res.data.action === "order_failed") {
        addBotMessage(res.data.response);
      }

      else if (res.data.action === "unauthenticated") {
        addBotMessage(res.data.response);
      }
      else if (res.data.action === "cart_navigate") {
          addBotMessage(res.data.response || "Navigating to your cart...");
          navigate("/cart");
      }

      else if (res.data.response) {
        addBotMessage(res.data.response);
      }

      else if (res.data.action === "switch_mode") {
        toggleDarkMode();
        addBotMessage("Switching theme mode...");
      }
      

      else if (res.data.intent) {
        addBotMessage(`Intent detected: ${res.data.intent}`);
      }

      else if (res.data.error) {
        addBotMessage(`Error: ${res.data.error}`);
      }

      else {
        addBotMessage("I'm not sure how to respond to that.");
      }

    } catch (err) {
      console.error(err);
      addBotMessage("Error communicating with server.");
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

          <div className="header-controls">
            <button 
              className={`voice-toggle-btn ${voiceEnabled ? 'enabled' : 'disabled'}`}
              onClick={toggleVoiceEnabled} 
              title={voiceEnabled ? "Disable Voice Output" : "Enable Voice Output"}>
                {voiceEnabled ? '🔊' : '🔇'}
            </button>

            <button className="close-btn" onClick={toggleChatbot}>✕</button>
          </div>
        </div>

        {/* Voice Input Status Bar */}
        {voiceInputStatus && (
          <div className={`voice-status-bar ${isListening ? 'listening' : ''}`}>
            <span className="voice-status-text">{voiceInputStatus}</span>
            {isListening && <div className="voice-pulse-indicator"></div>}
          </div>
        )}

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
              onClick={() => {
                window.speechSynthesis.cancel();
                currentSpeechRef.current = null;
              }}
            >
              <div className="message-content">
                {message.text && (
                  <p dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br/>') }}></p>
                )}

                {message.products && Array.isArray(message.products) && (
                  <ul className="product-list">
                    {message.products.map((product) => (
                      <li key={product.id}>
                        <strong>{product.name}</strong> (ID: {product.id}) - ₹{product.price}
                        <br />
                        {product.description}
                      </li>
                    ))}
                  </ul>
                )}

                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message bot">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chatbot-input" onSubmit={handleSendMessage}>
          <div className="input-wrapper">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isListening ? "Listening... Speak now" : "Type a message..."}
              disabled={isTyping}
              className={isListening ? 'listening' : ''}
            />
            
            <div className="input-controls">
              <button 
                type="button" 
                className={`voice-input-btn ${isListening ? 'listening' : ''}`}
                onClick={startListening} 
                title={isListening ? "Stop Voice Input" : "Start Voice Input"}
                disabled={isTyping}
              >
                {isListening ? (
                  <span className="stop-icon">⏹️</span>
                ) : (
                  <span className="mic-icon">🎙️</span>
                )}
              </button>
              
              <button 
                type="submit" 
                className="send-btn"
                disabled={isTyping || inputMessage.trim() === ''}
              >
                ➤
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="chatbot-toggle" onClick={toggleChatbot}>
        <div className="chat-icon">{isOpen ? '✕' : '💬'}</div>
        {!isOpen && messages.length > 0 && (
          <div className="notification-badge">{messages.length}</div>
        )}
      </div>
    </>
  );
};

export default Chatbot;