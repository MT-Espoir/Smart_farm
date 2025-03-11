import React from "react";
import { useState, useEffect } from "react";
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
      
      useEffect(() => {
        const fetchData = async () => {
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
      
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
      }, []);
    
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
            text: 'Soil Moisture Over Time',
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
      
      const soilMoistureData = {
        labels: historicalData.timestamps,
        datasets: [
          {
            fill: true,
            label: 'Soil Moisture (%)',
            data: historicalData.soil_moistures,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4,
          },
        ],
      };


    // Thêm state cho dữ liệu bảng
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const fetchCSVData = async () => {
      try {
        const response = await fetch('/Data/sensor_data.csv');
        const csvText = await response.text();
        const rows = csvText.split('\n')
          .filter(row => row.trim()) // Lọc bỏ dòng trống
          .map(row => {
            const [timestamp, temperature, humidity, soil_moisture, lux, pump_status] = row.split(',');
            return {
              timestamp: new Date(timestamp).toLocaleString(),
              temperature: parseFloat(temperature),
              humidity: parseFloat(humidity),
              soil_moisture: parseInt(soil_moisture),
              lux: parseInt(lux),
              pump_status: parseInt(pump_status)
            };
          });
        
        // Lấy 6 bản ghi mới nhất
        setTableData(rows.slice(-6));
      } catch (error) {
        console.error('Error loading CSV data:', error);
      }
    };

    fetchCSVData();
    const interval = setInterval(fetchCSVData, 5000); // Cập nhật mỗi 5 giây
    return () => clearInterval(interval);
  }, []);  

  // Thêm JSX cho bảng
  const renderTable = () => (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2">Thời gian</th>
            <th className="px-4 py-2">Nhiệt độ (°C)</th>
            <th className="px-4 py-2">Độ ẩm (%)</th>
            <th className="px-4 py-2">Độ ẩm đất (%)</th>
            <th className="px-4 py-2">Ánh sáng (lux)</th>
            <th className="px-4 py-2">Trạng thái bơm</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="px-4 py-2">{row.timestamp}</td>
              <td className="px-4 py-2">{row.temperature.toFixed(2)}</td>
              <td className="px-4 py-2">{row.humidity.toFixed(2)}</td>
              <td className="px-4 py-2">{row.soil_moisture}</td>
              <td className="px-4 py-2">{row.lux}</td>
              <td className="px-4 py-2">
                <span className={`px-2 py-1 rounded-full text-sm ${
                  row.pump_status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {row.pump_status ? 'Bật' : 'Tắt'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

    return (
        <>
            <div className="p-8">
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
            {renderTable()}
            </div>
        </>
    );
}

export default AnalystPage;