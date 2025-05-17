import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import {
  FaTemperatureHigh,
  FaTint,
  FaLightbulb,
  FaWater,
  FaBell,
  FaSun, // icon mặt trời (buổi trưa)
  FaMoon, // icon trăng (buổi tối)
  FaCloudSun, // icon mặt trời và mây (bình minh/hoàng hôn)
  FaClock
} from 'react-icons/fa';
import io from 'socket.io-client';
import Navigator from '../nav/navigator';
import './dashboard.css';
import backgroundbox1 from '../../assests/backgroundblock1.jpg';
import night from '../../assests/night.jpg';
import midday from '../../assests/midday.jpg';
import evening from '../../assests/evening.png';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [sensorData, setSensorData] = useState({
    temperature: 10,
    humidity: 0,
    soil_moisture: 0,
    lux: 0,
  });
  const [historicalData, setHistoricalData] = useState({
    timestamps: [],
    temperatures: [],
    humidities: [],
    soil_moistures: [],
  });
  const [notifications, setNotifications] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const getTimeIcon = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 7) {
      return <FaCloudSun className="time-icon sunrise" />; // Bình minh
    } else if (hour >= 7 && hour < 17) {
      return <FaSun className="time-icon day" />; // Ban ngày
    } else if (hour >= 17 && hour < 19) {
      return <FaCloudSun className="time-icon sunset" />; // Hoàng hôn
    } else if (hour >= 19 && hour < 5) {
      return <FaMoon className="time-icon night" />; // Ban đêm
    }
  };

  // Hàm xác định lời chào theo thời gian
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 10) {
      return "Good morning";
    } else if (hour >= 10 && hour < 13) {
      return "Good afternoon";
    } else if (hour >= 13 && hour < 17) {
      return "Good evening";
    } else {
      return "Good night";
    }
  };

  const getBackgroundImage = (hour) => {
    if (hour >= 5 && hour < 12) {
      return backgroundbox1;
    } else if (hour >= 12 && hour < 17) {
      return midday;
    } else if (hour >= 15 && hour < 19) {
      return evening;
    } else {
      return night;
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/sensor_data');
        const data = await response.json();
        if (data.length > 0) {
          // Cập nhật dữ liệu hiện tại
          const latestData = data[0];
          setSensorData({
            temperature: latestData.temperature,
            humidity: latestData.humidity,
            soil_moisture: latestData.soil_moisture,
            lux: latestData.lux,
          });

          // Cập nhật dữ liệu lịch sử
          const last20Records = data.slice(0, 10);
          setHistoricalData({
            timestamps: last20Records.map(record => new Date(record.timestamp).toLocaleTimeString()),
            temperatures: last20Records.map(record => record.temperature),
            humidities: last20Records.map(record => record.humidity),
            soil_moistures: last20Records.map(record => record.soil_moisture),
          });
        }
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Connect to Socket.io for real-time updates
    const socket = io("http://localhost:5000");
    
    socket.on("new_sensor_data", (newData) => {
      console.log("Received new sensor data:", newData);
      setSensorData({
        temperature: newData.temperature,
        humidity: newData.humidity,
        soil_moisture: newData.soil_moisture,
        lux: newData.lux,
      });
      
      // Update historical data by adding the new point
      setHistoricalData(prevData => {
        const newTimestamp = new Date().toLocaleTimeString();
        
        return {
          timestamps: [newTimestamp, ...prevData.timestamps.slice(0, 9)],
          temperatures: [newData.temperature, ...prevData.temperatures.slice(0, 9)],
          humidities: [newData.humidity, ...prevData.humidities.slice(0, 9)],
          soil_moistures: [newData.soil_moisture, ...prevData.soil_moistures.slice(0, 9)],
        };
      });
    });
    
    // Cleanup function
    return () => {
      socket.disconnect();
    };
  }, []);

  // Cấu hình cho biểu đồ nhiệt độ và độ ẩm
  const tempHumidityOptions = {
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Temperature and Humidity Over Time',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        position: 'nearest',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 10,
        cornerRadius: 4,
        caretSize: 6,
        caretPadding: 2,
        displayColors: true,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const tempHumidityData = {
    labels: historicalData.timestamps,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: historicalData.temperatures,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Humidity (%)',
        data: historicalData.humidities,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  // Cấu hình cho biểu đồ độ ẩm đất
  const soilMoistureOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Soil Moisture Over Time',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        position: 'nearest',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 10,
        cornerRadius: 4,
        caretSize: 6,
        caretPadding: 2,
        displayColors: true,
        callbacks: {
          label: function (context) {
            return `Soil Moisture: ${context.parsed.y.toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
  };

  const soilMoistureData = {
    labels: historicalData.timestamps,
    datasets: [
      {
        fill: true,  // Bật chế độ fill
        label: 'Soil Moisture (%)',
        data: historicalData.soil_moistures,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,  // Làm mượt đường
        pointRadius: 5,  // Kích thước điểm
        pointHoverRadius: 6,  // Kích thước điểm khi hover
        pointBackgroundColor: 'rgb(75, 192, 192)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  useEffect(() => {
    // Timer để cập nhật thời gian mỗi giây
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format thời gian
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Format ngày tháng
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Navigator />
      <div className="dashboard-container">
        <div className="top-row">
          <div className="block metrics-block"
            style={{
              backgroundImage: `url(${getBackgroundImage(currentTime.getHours())})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}>
            <div className="metrics-layout">
              <div className="greeting">
                <div className="greeting-right">
                  <div className="time-display">
                    {getTimeIcon()}
                    <div className="time-info">
                      <p className="current-time">{formatTime(currentTime)}</p>
                      <p className="current-date">{formatDate(currentTime)}</p>
                    </div>
                  </div>
                </div>
                <div className="greeting-left">
                  <h1>{getGreeting()} user !!</h1>
                  <h1>Wish you a nice day</h1>
                </div>
              </div>
              <div className="metrics-grid">
                <div className="metric-box">
                  <FaTemperatureHigh className="metric-icon" />
                  <h3 className="metric-label">Temp</h3>
                  <p className="metric-value">{sensorData.temperature}°C</p>
                  <div className='toggle_button'>
                    <label class="inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" class="sr-only peer"></input>
                      <div class="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-dark_green dark:peer-focus:ring-dark_green rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-500 peer-checked:bg-dark_green dark:peer-checked:bg-mint-600"></div>
                    </label>
                  </div>
                </div>

                <div className="metric-box">
                  <FaTint className="metric-icon" />
                  <h3 className="metric-label">Humid</h3>
                  <p className="metric-value">{sensorData.humidity}%</p>
                </div>
                <div className="metric-box">
                  <FaLightbulb className="metric-icon" />
                  <h3 className="metric-label">Lux</h3>
                  <p className="metric-value">{sensorData.lux} lx</p>
                  <div className='toggle_button'>
                    <label class="inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" class="sr-only peer"></input>
                      <div class="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-dark_green dark:peer-focus:ring-dark_green rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-500 peer-checked:bg-dark_green dark:peer-checked:bg-mint-600"></div>
                    </label>
                  </div>
                </div>
                <div className="metric-box">
                  <FaWater className="metric-icon" />
                  <h3 className="metric-label">Moisture</h3>
                  <p className="metric-value">{sensorData.soil_moisture}%</p>
                  <div className='toggle_button'>
                    <label class="inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" class="sr-only peer"></input>
                      <div class="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-dark_green dark:peer-focus:ring-dark_green rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-500 peer-checked:bg-dark_green dark:peer-checked:bg-mint-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="block notifications-block">
            <div className="notification-header">
              <FaBell className="bell-icon" />
              <h2>Notifications</h2>
            </div>
            <div className="notification-list">
              {notifications.map((note, index) => (
                <p key={index}>• {note}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="bottom-row">
          <div className="block graph-block">
            <h2>Temperature & Humidity Graph</h2>
            <Line options={tempHumidityOptions} data={tempHumidityData} />
          </div>
          <div className="block graph-block">
            <h2>Soil Moisture Graph</h2>
            <Line options={soilMoistureOptions} data={soilMoistureData} />
            {/* Thêm component cho độ ẩm đất nếu cần */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;