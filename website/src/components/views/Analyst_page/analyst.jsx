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



    return (
        <>
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
            <div>
                <FetchData />
            </div>
            </div>
        </>
    );
}

export default AnalystPage;