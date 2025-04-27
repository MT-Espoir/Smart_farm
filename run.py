import subprocess
import time
import threading
import os
import sys

def run_flask_server():
    print("Starting Flask server...")
    # Use sys.executable to ensure the same Python interpreter is used
    subprocess.run([sys.executable, "backend/web_server.py"])

def run_node_server():
    print("Starting Node.js server...")
    subprocess.run(["node", "backend/server.js"], cwd=os.path.dirname(os.path.abspath(__file__)))

def run_react_frontend():
    print("Starting React frontend...")
    # Use shell=True for npm commands since they're shell commands
    subprocess.run("cd website && npm start", shell=True)

if __name__ == "__main__":
    print("Starting SmartFarm services...")
    
    # Start all services in separate threads
    threading.Thread(target=run_flask_server, daemon=True).start()
    threading.Thread(target=run_node_server, daemon=True).start()
    threading.Thread(target=run_react_frontend, daemon=True).start()
    
    # Wait a moment to ensure services are starting up
    time.sleep(3)
    print("All services starting! You can access:")
    print("- Flask API: http://localhost:5000")
    print("- Node.js API: http://localhost:5001")
    print("- React frontend: http://localhost:3000")
    
    try:
        # Keep main thread running to allow Ctrl+C to stop all threads
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down all services...")