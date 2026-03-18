#!/bin/bash

# Tengebai.kz Autotest Setup Script

echo "Setting up Tengebai.kz Autotest environment..."
echo "=============================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python3 is not installed. Please install Python 3.7 or higher."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "Python version: $PYTHON_VERSION"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "Error: pip3 is not installed. Please install pip for Python 3."
    exit 1
fi

# Create virtual environment (optional)
read -p "Create virtual environment? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "Virtual environment activated."
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Install Playwright browsers
echo "Installing Playwright browsers..."
python3 -m playwright install chromium

# Make the autotest script executable
chmod +x tengebai_autotest.py

echo ""
echo "Setup complete!"
echo "==============="
echo ""
echo "To run the autotest:"
echo "  python tengebai_autotest.py"
echo ""
echo "Options:"
echo "  --headless  Run without browser window"
echo "  --debug     Run with slower execution for debugging"
echo ""
echo "Example:"
echo "  python tengebai_autotest.py --headless --debug"