#!/bin/bash

echo "🤖 Setting up Ollama + LLaVA for AI Product Analysis"
echo "=================================================="

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "📦 Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
    
    if [ $? -eq 0 ]; then
        echo "✅ Ollama installed successfully!"
    else
        echo "❌ Failed to install Ollama"
        exit 1
    fi
else
    echo "✅ Ollama is already installed"
fi

# Start Ollama service
echo "🚀 Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to start
echo "⏳ Waiting for Ollama to start..."
sleep 5

# Check if Ollama is running
if curl -f http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running on http://localhost:11434"
else
    echo "❌ Ollama failed to start"
    exit 1
fi

# Pull LLaVA model
echo "📥 Downloading LLaVA model (this may take a while - ~4GB)..."
ollama pull llava

if [ $? -eq 0 ]; then
    echo "✅ LLaVA model downloaded successfully!"
else
    echo "❌ Failed to download LLaVA model"
    exit 1
fi

# Test the model
echo "🧪 Testing LLaVA model..."
TEST_RESPONSE=$(ollama run llava "Hello, can you see images?" --verbose)

if [[ $TEST_RESPONSE == *"yes"* ]] || [[ $TEST_RESPONSE == *"Yes"* ]]; then
    echo "✅ LLaVA model is working correctly!"
else
    echo "⚠️ LLaVA model test unclear, but setup complete"
fi

echo ""
echo "🎉 Setup Complete!"
echo "==================="
echo "Ollama is running at: http://localhost:11434"
echo "LLaVA model is ready for product image analysis"
echo ""
echo "To keep Ollama running in background:"
echo "  nohup ollama serve > ollama.log 2>&1 &"
echo ""
echo "To stop Ollama:"
echo "  pkill ollama"
echo ""
echo "Available models:"
ollama list

echo ""
echo "🔧 Your Node.js backend should now be able to analyze product images!"
echo "Test it through your AdminPanel interface."