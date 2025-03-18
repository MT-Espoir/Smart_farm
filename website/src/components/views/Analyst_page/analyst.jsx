import React from "react";
import { useState, useEffect } from "react";
import FetchData from "./fechdata";
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


function AnalystPage() {
  const [historicalData, setHistoricalData] = useState({
      timestamps: [],
      temperatures: [],
      humidities: [],
      soil_moistures: [],
  });
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [viewMode, setViewMode] = useState("live"); // "live" or "historical"
  const [isLoading, setIsLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Fetch live data
  useEffect(() => {
      let intervalId;
      
      const fetchLiveData = async () => {
          try {
              const response = await fetch('http://localhost:5000/api/sensor_data');
              const data = await response.json();
              if (data.length > 0) {
                  const last10Records = data.slice(-10);
                  setHistoricalData({
                      timestamps: last10Records.map(record => new Date(record.timestamp).toLocaleTimeString()),
                      temperatures: last10Records.map(record => record.temperature),
                      humidities: last10Records.map(record => record.humidity),
                      soil_moistures: last10Records.map(record => record.soil_moisture),
                  });
              }
          } catch (error) {
              console.error('Error fetching sensor data:', error);
          }
      };
      
      if (viewMode === "live") {
          fetchLiveData();
          intervalId = setInterval(fetchLiveData, 5000);
      }
      
      return () => {
          if (intervalId) clearInterval(intervalId);
      };
  }, [viewMode]);
  
  // Fetch historical data when date changes
  useEffect(() => {
      const fetchHistoricalData = async () => {
          if (viewMode !== "historical") return;
          
          setIsLoading(true);
          try {
              const response = await fetch(`http://localhost:5000/api/sensor_data/by-date/${selectedDate}`);
              const data = await response.json();
              
              if (data.length > 0) {
                  setHistoricalData({
                      timestamps: data.map(record => new Date(record.timestamp).toLocaleTimeString()),
                      temperatures: data.map(record => record.temperature),
                      humidities: data.map(record => record.humidity),
                      soil_moistures: data.map(record => record.soil_moisture),
                  });
              } else {
                  // Reset data if nothing found
                  setHistoricalData({
                      timestamps: [],
                      temperatures: [],
                      humidities: [],
                      soil_moistures: [],
                  });
              }
          } catch (error) {
              console.error('Error fetching historical data:', error);
          } finally {
              setIsLoading(false);
          }
      };
      
      if (viewMode === "historical") {
          fetchHistoricalData();
      }
  }, [selectedDate, viewMode]);
  
  // Handle date change
  const handleDateChange = (e) => {
      setSelectedDate(e.target.value);
  };
  
  // Toggle calendar and switch modes
  const toggleCalendar = () => {
      if (calendarOpen) {
          // If calendar is open, close it and switch to live mode
          setCalendarOpen(false);
          setViewMode("live");
      } else {
          // If calendar is closed, open it and switch to historical mode
          setCalendarOpen(true);
          setViewMode("historical");
      }
  };
  
  // Quick date selection
  const selectPreviousDay = (daysAgo) => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      setSelectedDate(date.toISOString().split('T')[0]);
  };

  const tempHumidityOptions = {
      plugins: {
          legend: {
              position: 'top',
          },
          title: {
              display: true,
              text: viewMode === "live" ? 'Nhiệt độ và độ ẩm theo thời gian thực' : `Nhiệt độ và độ ẩm (${selectedDate})`,
          },
          tooltip: {
              mode: 'index',
              intersect: false,
          }
      },
      scales: {
          y: {
              beginAtZero: false,
          },
      },
  };
    
  const soilMoistureOptions = {
      responsive: true,
      plugins: {
          legend: {
              position: 'top',
          },
          title: {
              display: true,
              text: viewMode === "live" ? 'Độ ẩm đất theo thời gian thực' : `Độ ẩm đất (${selectedDate})`,
          }
      },
      scales: {
          y: {
              beginAtZero: true,
              max: 100,
          }
      },
  };
    
  const tempHumidityData = {
    labels: historicalData.timestamps,
    datasets: [
      {
        label: 'Nhiệt độ (°C)',
        data: historicalData.temperatures,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Độ ẩm (%)',
        data: historicalData.humidities,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };
  
  const soilMoistureData = {
    labels: historicalData.timestamps,
    datasets: [
      {
        fill: true,
        label: 'Độ ẩm đất (%)',
        data: historicalData.soil_moistures,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={toggleCalendar}
          className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-md flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Lịch
        </button>
        
        {calendarOpen && (
          <div className="flex flex-wrap items-center gap-2">
            <input 
              type="date" 
              value={selectedDate}
              onChange={handleDateChange}
              className="border rounded px-3 py-2"
            />
            
            <div className="flex space-x-2">
              <button 
                onClick={() => selectPreviousDay(1)}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded"
              >
                Hôm qua
              </button>
              <button 
                onClick={() => selectPreviousDay(2)}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded"
              >
                2 ngày trước
              </button>
              <button 
                onClick={() => selectPreviousDay(7)}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded"
              >
                7 ngày trước
              </button>
              <button 
                onClick={() => selectPreviousDay(30)}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded"
              >
                30 ngày trước
              </button>
            </div>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : historicalData.timestamps.length === 0 && viewMode === "historical" ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Không có dữ liệu cho ngày đã chọn</p>
        </div>
      ) : (
        <div className="p-8">
            <div className="bottom-row">
                <div className="block graph-block">
                    <h2 className="font-bold">Temperature & Humidity Graph</h2>
                    <Line options={tempHumidityOptions} data={tempHumidityData} />
                </div>
                <div className="block graph-block">
                    <h2 className="font-bold">Soil Moisture Graph</h2>
                    <Line options={soilMoistureOptions} data={soilMoistureData} />
                    {/* Thêm component cho độ ẩm đất nếu cần */}
                </div>
            </div>
          </div>  
      )}
      
      {viewMode === "historical" && historicalData.timestamps.length > 0 && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow overflow-x-auto">
          <h2 className="font-bold mb-4">Bảng dữ liệu lịch sử - {selectedDate}</h2>
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-left">Thời gian</th>
                <th className="border p-2 text-left">Nhiệt độ (°C)</th>
                <th className="border p-2 text-left">Độ ẩm (%)</th>
                <th className="border p-2 text-left">Độ ẩm đất (%)</th>
              </tr>
            </thead>
            <tbody>
              {historicalData.timestamps.map((time, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border p-2">{time}</td>
                  <td className="border p-2">{historicalData.temperatures[index]}</td>
                  <td className="border p-2">{historicalData.humidities[index]}</td>
                  <td className="border p-2">{historicalData.soil_moistures[index]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {viewMode === "live" && (
        <div className="mt-6">
          <FetchData />
        </div>
      )}
    </div>
  );
}

export default AnalystPage;