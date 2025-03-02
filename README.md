1/ Chạy backend lấy db từ mysql: chạy lần lượt các lệnh sau
- cd backend
- npm install express           # Framework backend
  npm install mysql2            # Kết nối MySQL
  npm install dotenv            # Đọc file .env
  npm install cors              # Xử lý CORS
- node server.js

2/ chuyển sang tailwind v3
- chạy lệnh này trước để cập nhật các hiệu ứng css cho trang khi thay đổi
npx tailwindcss -i ./website/src/components/assests/css/input.css -o ./website/src/components/assests/css/output.css --watch
