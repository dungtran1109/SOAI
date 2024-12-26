# Install Ollama

    Go to this link and install to your OS

    https://ollama.com/download

    After installing. You need to pull some models below

    ollama pull phi3
    ollama pull llama2
    ollama pull llama3
    You can add more and run on each of them

## Branch to build

    - main: A chatbot without Chat history
    - master: A chatbot with Chat History(Need improvement on Chat History)

## Setting Up Your Python 3.11 Development Environment

    This guide provides comprehensive instructions for installing Python 3.11, pip (package manager), and virtualenv (for isolated project environments) on both Ubuntu and Windows operating systems.

## Ubuntu

    Add the Python 3.11 Repository
    Open a terminal window (Ctrl+Alt+T) and execute the following commands:
    sudo add-apt-repository ppa:deadsnakes/ppa
    sudo apt update
    Press Enter to confirm adding the repository.

    Install Python 3.11
    Install Python 3.11 along with its development headers (recommended for broader package compatibility):
    sudo apt install python3.11 python3.11-dev python3.11-venv

    Verify Installation
    Confirm successful installation by checking the Python version: <python3.11 --version>

    Install virtualenv
    Open a terminal window and run:
    pip install virtualenv

## Windows

    Download the Python 3.11 Installer
    Visit the official Python downloads page: <https://www.python.org/downloads/>
    Download the latest Windows installer for Python 3.11 (64-bit recommended).

    Run the Installer with Administrative Privileges
    Double-click the downloaded installer.
    Crucially: During installation, ensure you select the option to "Add Python 3.11 to PATH". This enables running Python commands from any location in PowerShell.

    Verify Installation
    Open a PowerShell window (search for "PowerShell" in the Start menu).
    Type python --version and press Enter.The expected output is Python 3.11.x.

    Install virtualenv
    Open a PowerShell window and run:
    pip install virtualenv

    Using Virtual Environments
    Open a PowerShell window and navigate to your project directory. Execute the following command:
    python3.11 -m venv my_venv  # Replace "my_venv" with your desired name
    This creates a virtual environment named my_venv within your current directory.

    Activating the Virtual Environment
    Activate the virtual environment using the following command:
    .\my_venv\Scripts\activate.bat  # Windows
    source my_venv/bin/activate # ubuntu

## To run the private chatbot

    cd main-source # navigate to the main source of the project
    # Create virtual environment and activate it
    virtualenv chatbotenv
    .\chatbotenv\Scripts\activate.bat  # Windows
    source chatbotenv/bin/activate # ubuntu

## To install all packages

    pip install -r requirements.txt

## To run the private chatbot

    streamlit run UI.py
