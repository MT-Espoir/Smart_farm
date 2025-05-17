import React, { useState, useEffect } from 'react';
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
import { Line } from 'react-chartjs-2';

// Register Chart.js components
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

function AnalystDetail() {
  // Tab state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Overview tab data
  const [overviewData, setOverviewData] = useState({
    temperatureChart: '',
    humidityChart: '',
    lightChart: '',
    correlationHeatmap: '',
    temperatureDistribution: '',
  });
  
  // Daily statistics tab data
  const [dailyStatsData, setDailyStatsData] = useState({});
  const [selectedDays, setSelectedDays] = useState(7);
  
  // Correlation tab data
  const [correlationData, setCorrelationData] = useState({
    correlation_matrix: {},
    strong_correlations: []
  });
  
  // Hourly patterns tab data
  const [hourlyData, setHourlyData] = useState({});
  
  // Optimal conditions tab data
  const [optimalData, setOptimalData] = useState({
    general: {
      temperature: { optimal_range: [0, 0], description: '' },
      humidity: { optimal_range: [0, 0], description: '' },
      soil_moisture: { optimal_range: [0, 0], description: '' },
      lux: { optimal_range: [0, 0], description: '' }
    }
  });
    // Anomalies tab data
  const [anomalyData, setAnomalyData] = useState({
    total_anomalies: 0,
    anomalies: []
  });
  
  // Loading states
  const [loading, setLoading] = useState({
    overview: false,
    daily: false,    correlation: false,
    hourly: false,
    optimal: false,
    anomalies: false
  });
  
  // Error states
  const [errors, setErrors] = useState({
    overview: '',
    daily: '',    correlation: '',
    hourly: '',
    optimal: '',
    anomalies: ''
  });

  // Helper function to set loading state
  const setLoadingState = (tab, isLoading) => {
    setLoading(prev => ({ ...prev, [tab]: isLoading }));
  };

  // Helper function to set error state
  const setErrorState = (tab, error) => {
    setErrors(prev => ({ ...prev, [tab]: error }));
  };

  // Load overview tab data
  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverviewData();
    }
  }, [activeTab]);

  const loadOverviewData = async () => {
    setLoadingState('overview', true);
    try {
      const response = await fetch('http://localhost:5000/api/analytics/charts');
      const data = await response.json();
      
      if (data.error) {
        setErrorState('overview', data.error);
      } else {
        setOverviewData(data);
        setErrorState('overview', '');
      }
    } catch (error) {
      console.error('Error loading overview data:', error);
      setErrorState('overview', error.message);
    } finally {
      setLoadingState('overview', false);
    }
  };

  // Load daily statistics data
  useEffect(() => {
    if (activeTab === 'daily') {
      loadDailyStatsData(selectedDays);
    }
  }, [activeTab, selectedDays]);

  const loadDailyStatsData = async (days) => {
    setLoadingState('daily', true);
    try {
      const response = await fetch(`http://localhost:5000/api/analytics/daily-statistics?days=${days}`);
      const data = await response.json();
      
      if (data.error) {
        setErrorState('daily', data.error);
      } else {
        setDailyStatsData(data);
        setErrorState('daily', '');
      }
    } catch (error) {
      console.error('Error loading daily statistics:', error);
      setErrorState('daily', error.message);
    } finally {
      setLoadingState('daily', false);
    }
  };

  // Load correlation data
  useEffect(() => {
    if (activeTab === 'correlation') {
      loadCorrelationData();
    }
  }, [activeTab]);

  const loadCorrelationData = async () => {
    setLoadingState('correlation', true);
    try {
      const response = await fetch('http://localhost:5000/api/analytics/correlation');
      const data = await response.json();
      
      if (data.error) {
        setErrorState('correlation', data.error);
      } else {
        setCorrelationData(data);
        setErrorState('correlation', '');
      }
    } catch (error) {
      console.error('Error loading correlation data:', error);
      setErrorState('correlation', error.message);
    } finally {
      setLoadingState('correlation', false);
    }
  };

  // Load hourly patterns data
  useEffect(() => {
    if (activeTab === 'hourly') {
      loadHourlyData();
    }
  }, [activeTab]);

  const loadHourlyData = async () => {
    setLoadingState('hourly', true);
    try {
      const response = await fetch('http://localhost:5000/api/analytics/hourly-patterns');
      const data = await response.json();
      
      if (data.error) {
        setErrorState('hourly', data.error);
      } else {
        setHourlyData(data);
        setErrorState('hourly', '');
      }
    } catch (error) {
      console.error('Error loading hourly patterns:', error);
      setErrorState('hourly', error.message);
    } finally {
      setLoadingState('hourly', false);
    }
  };

  // Load optimal conditions data
  useEffect(() => {
    if (activeTab === 'optimal') {
      loadOptimalData();
    }
  }, [activeTab]);

  const loadOptimalData = async () => {
    setLoadingState('optimal', true);
    try {
      const response = await fetch('http://localhost:5000/api/analytics/optimal-conditions');
      const data = await response.json();
      
      if (data.error) {
        setErrorState('optimal', data.error);
      } else {
        setOptimalData(data);
        setErrorState('optimal', '');
      }
    } catch (error) {
      console.error('Error loading optimal conditions:', error);
      setErrorState('optimal', error.message);
    } finally {
      setLoadingState('optimal', false);
    }
  };

  // Load anomalies data
  useEffect(() => {
    if (activeTab === 'anomalies') {
      loadAnomalyData();
    }
  }, [activeTab]);

  const loadAnomalyData = async () => {
    setLoadingState('anomalies', true);
    try {
      const response = await fetch('http://localhost:5000/api/analytics/anomalies');
      const data = await response.json();
      
      if (data.error) {
        setErrorState('anomalies', data.error);
      } else {
        setAnomalyData(data);
        setErrorState('anomalies', '');
      }
    } catch (error) {
      console.error('Error loading anomalies:', error);
      setErrorState('anomalies', error.message);
    } finally {
      setLoadingState('anomalies', false);
    }  };

  // Helper functions for formatting
  const formatParameterName = (param) => {
    const names = {
      'temperature': 'Nhiệt độ',
      'humidity': 'Độ ẩm',
      'soil_moisture': 'Độ ẩm đất',
      'lux': 'Ánh sáng'
    };
    return names[param] || param;
  };

  const getCorrelationColorClass = (value) => {
    if (value === 1) return 'bg-[#00ff00] text-black';
    if (value > 0.8) return 'bg-[#33ff33] text-black';
    if (value > 0.6) return 'bg-[#66ff66] text-black';
    if (value > 0.4) return 'bg-[#99ff99] text-black';
    if (value > 0.2) return 'bg-[#ccffcc] text-black';
    if (value > -0.2) return 'bg-white text-black';
    if (value > -0.4) return 'bg-[#ffcccc] text-black';
    if (value > -0.6) return 'bg-[#ff9999] text-black';
    if (value > -0.8) return 'bg-[#ff6666] text-white';
    if (value > -1) return 'bg-[#ff3333] text-white';
    return 'bg-[#ff0000] text-white';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  // Chart configuration for hourly patterns
  const prepareHourlyCharts = () => {
    if (!hourlyData || Object.keys(hourlyData).length === 0) return null;

    const hours = Array.from(Array(24).keys());
    const tempData = hours.map(h => hourlyData[h] ? hourlyData[h].temperature : null);
    const humidityData = hours.map(h => hourlyData[h] ? hourlyData[h].humidity : null);
    const soilData = hours.map(h => hourlyData[h] ? hourlyData[h].soil_moisture : null);
    const luxData = hours.map(h => hourlyData[h] ? hourlyData[h].lux : null);

    const hourlyCharts = {
      temperature: {
        labels: hours.map(h => h + ':00'),
        datasets: [{
          label: 'Nhiệt độ (°C)',
          data: tempData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true,
          tension: 0.4
        }]
      },
      humidity: {
        labels: hours.map(h => h + ':00'),
        datasets: [{
          label: 'Độ ẩm (%)',
          data: humidityData,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
          tension: 0.4
        }]
      },
      soil: {
        labels: hours.map(h => h + ':00'),
        datasets: [{
          label: 'Độ ẩm đất (%)',
          data: soilData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.4
        }]
      },
      lux: {
        labels: hours.map(h => h + ':00'),
        datasets: [{
          label: 'Cường độ ánh sáng (lux)',
          data: luxData,
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          fill: true,
          tension: 0.4
        }]
      }
    };

    return hourlyCharts;
  };

  const hourlyChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: ''
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

  const hourlyCharts = prepareHourlyCharts();

  return (
    <div className="container mx-auto my-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Phân tích dữ liệu môi trường</h1>
        {/* Tabs */}
      <div className="mb-6">
        <ul className="flex flex-wrap border-b border-gray-200">
          <li className="mr-2">
            <button 
              onClick={() => setActiveTab('overview')} 
              className={`py-2 px-4 font-medium ${activeTab === 'overview' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-green-500'}`}
            >
              Tổng quan
            </button>
          </li>
          <li className="mr-2">
            <button 
              onClick={() => setActiveTab('daily')} 
              className={`py-2 px-4 font-medium ${activeTab === 'daily' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-green-500'}`}
            >
              Thống kê hàng ngày
            </button>
          </li>
          <li className="mr-2">
            <button 
              onClick={() => setActiveTab('correlation')} 
              className={`py-2 px-4 font-medium ${activeTab === 'correlation' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-green-500'}`}
            >
              Tương quan
            </button>
          </li>
          <li className="mr-2">
            <button 
              onClick={() => setActiveTab('hourly')} 
              className={`py-2 px-4 font-medium ${activeTab === 'hourly' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-green-500'}`}
            >
              Mẫu theo giờ
            </button>
          </li>
          <li className="mr-2">
            <button 
              onClick={() => setActiveTab('optimal')} 
              className={`py-2 px-4 font-medium ${activeTab === 'optimal' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-green-500'}`}
            >
              Điều kiện tối ưu
            </button>
          </li>
          <li className="mr-2">
            <button 
              onClick={() => setActiveTab('anomalies')} 
              className={`py-2 px-4 font-medium ${activeTab === 'anomalies' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-green-500'}`}
            >
              Phát hiện bất thường
            </button>
          </li>
        </ul>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {loading.overview ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : errors.overview ? (
              <div className="text-red-500 p-4 bg-red-50 rounded">{errors.overview}</div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
                      <div className="bg-green-600 text-white py-2 px-4 font-bold">
                        Nhiệt độ (7 ngày qua)
                      </div>
                      <div className="p-4">
                        {overviewData.temperature_time_series && (
                          <img 
                            src={`data:image/png;base64,${overviewData.temperature_time_series}`} 
                            alt="Temperature chart" 
                            className="w-full"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
                      <div className="bg-green-600 text-white py-2 px-4 font-bold">
                        Phân bố nhiệt độ
                      </div>
                      <div className="p-4">
                        {overviewData.temperature_distribution && (
                          <img 
                            src={`data:image/png;base64,${overviewData.temperature_distribution}`} 
                            alt="Temperature distribution" 
                            className="w-full"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
                      <div className="bg-green-600 text-white py-2 px-4 font-bold">
                        Độ ẩm và độ ẩm đất (7 ngày qua)
                      </div>
                      <div className="p-4">
                        {overviewData.humidity_soil_time_series && (
                          <img 
                            src={`data:image/png;base64,${overviewData.humidity_soil_time_series}`} 
                            alt="Humidity chart" 
                            className="w-full"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
                      <div className="bg-green-600 text-white py-2 px-4 font-bold">
                        Cường độ ánh sáng (7 ngày qua)
                      </div>
                      <div className="p-4">
                        {overviewData.light_time_series && (
                          <img 
                            src={`data:image/png;base64,${overviewData.light_time_series}`} 
                            alt="Light chart" 
                            className="w-full"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="bg-green-600 text-white py-2 px-4 font-bold">
                      Tương quan giữa các thông số
                    </div>
                    <div className="p-4">
                      {overviewData.correlation_heatmap && (
                        <img 
                          src={`data:image/png;base64,${overviewData.correlation_heatmap}`} 
                          alt="Correlation heatmap" 
                          className="w-full max-w-3xl mx-auto"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Daily Statistics Tab */}
        {activeTab === 'daily' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-green-600 text-white py-2 px-4 font-bold flex justify-between items-center">
              <span>Thống kê hàng ngày</span>
              <select 
                className="bg-white text-gray-800 text-sm rounded px-2 py-1"
                value={selectedDays}
                onChange={(e) => setSelectedDays(Number(e.target.value))}
              >
                <option value={7}>7 ngày qua</option>
                <option value={14}>14 ngày qua</option>
                <option value={30}>30 ngày qua</option>
              </select>
            </div>
            <div className="p-4">
              {loading.daily ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : errors.daily ? (
                <div className="text-red-500 p-4 bg-red-50 rounded">{errors.daily}</div>
              ) : Object.keys(dailyStatsData).length === 0 ? (
                <p>Không có dữ liệu trong khoảng thời gian này.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                      <tr>
                        <th rowSpan="2" className="border border-gray-300 bg-gray-100 p-2">Ngày</th>
                        <th colSpan="4" className="border border-gray-300 bg-gray-100 p-2">Nhiệt độ (°C)</th>
                        <th colSpan="4" className="border border-gray-300 bg-gray-100 p-2">Độ ẩm (%)</th>
                        <th colSpan="4" className="border border-gray-300 bg-gray-100 p-2">Độ ẩm đất (%)</th>
                        <th colSpan="4" className="border border-gray-300 bg-gray-100 p-2">Ánh sáng (lux)</th>
                      </tr>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2">Min</th>
                        <th className="border border-gray-300 p-2">Max</th>
                        <th className="border border-gray-300 p-2">Avg</th>
                        <th className="border border-gray-300 p-2">Std</th>
                        <th className="border border-gray-300 p-2">Min</th>
                        <th className="border border-gray-300 p-2">Max</th>
                        <th className="border border-gray-300 p-2">Avg</th>
                        <th className="border border-gray-300 p-2">Std</th>
                        <th className="border border-gray-300 p-2">Min</th>
                        <th className="border border-gray-300 p-2">Max</th>
                        <th className="border border-gray-300 p-2">Avg</th>
                        <th className="border border-gray-300 p-2">Std</th>
                        <th className="border border-gray-300 p-2">Min</th>
                        <th className="border border-gray-300 p-2">Max</th>
                        <th className="border border-gray-300 p-2">Avg</th>
                        <th className="border border-gray-300 p-2">Std</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(dailyStatsData).sort().map(date => {
                        const day = dailyStatsData[date];
                        return (
                          <tr key={date}>
                            <td className="border border-gray-300 p-2">{formatDate(date)}</td>
                            <td className="border border-gray-300 p-2">{day.temperature.min.toFixed(1)}</td>
                            <td className="border border-gray-300 p-2">{day.temperature.max.toFixed(1)}</td>
                            <td className="border border-gray-300 p-2">{day.temperature.mean.toFixed(1)}</td>
                            <td className="border border-gray-300 p-2">{day.temperature.std.toFixed(2)}</td>
                            <td className="border border-gray-300 p-2">{day.humidity.min.toFixed(1)}</td>
                            <td className="border border-gray-300 p-2">{day.humidity.max.toFixed(1)}</td>
                            <td className="border border-gray-300 p-2">{day.humidity.mean.toFixed(1)}</td>
                            <td className="border border-gray-300 p-2">{day.humidity.std.toFixed(2)}</td>
                            <td className="border border-gray-300 p-2">{day.soil_moisture.min.toFixed(1)}</td>
                            <td className="border border-gray-300 p-2">{day.soil_moisture.max.toFixed(1)}</td>
                            <td className="border border-gray-300 p-2">{day.soil_moisture.mean.toFixed(1)}</td>
                            <td className="border border-gray-300 p-2">{day.soil_moisture.std.toFixed(2)}</td>
                            <td className="border border-gray-300 p-2">{day.lux.min.toFixed(0)}</td>
                            <td className="border border-gray-300 p-2">{day.lux.max.toFixed(0)}</td>
                            <td className="border border-gray-300 p-2">{day.lux.mean.toFixed(0)}</td>
                            <td className="border border-gray-300 p-2">{day.lux.std.toFixed(0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Correlation Tab */}
        {activeTab === 'correlation' && (
          <div>
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="bg-green-600 text-white py-2 px-4 font-bold">
                Ma trận tương quan
              </div>
              <div className="p-4">
                {loading.correlation ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                ) : errors.correlation ? (
                  <div className="text-red-500 p-4 bg-red-50 rounded">{errors.correlation}</div>
                ) : !correlationData.correlation_matrix || Object.keys(correlationData.correlation_matrix).length === 0 ? (
                  <p>Không có dữ liệu tương quan.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 p-2"></th>
                          {Object.keys(correlationData.correlation_matrix).map(param => (
                            <th key={param} className="border border-gray-300 p-2">{formatParameterName(param)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(correlationData.correlation_matrix).map(row => (
                          <tr key={row}>
                            <th className="border border-gray-300 p-2 text-left font-semibold">{formatParameterName(row)}</th>
                            {Object.keys(correlationData.correlation_matrix).map(col => {
                              const value = correlationData.correlation_matrix[row][col];
                              return (
                                <td 
                                  key={col} 
                                  className={`border border-gray-300 p-2 text-center ${getCorrelationColorClass(value)}`}
                                >
                                  {value.toFixed(2)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-green-600 text-white py-2 px-4 font-bold">
                Tương quan mạnh
              </div>
              <div className="p-4">
                {loading.correlation ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                ) : errors.correlation ? (
                  <div className="text-red-500 p-4 bg-red-50 rounded">{errors.correlation}</div>
                ) : correlationData.strong_correlations.length === 0 ? (
                  <p>Không tìm thấy tương quan mạnh giữa các thông số.</p>
                ) : (
                  <ul className="list-group">
                    {correlationData.strong_correlations.map((corr, index) => {
                      const corrType = corr.type === 'positive' ? 'Tương quan thuận' : 'Tương quan nghịch';
                      return (
                        <li key={index} className="border border-gray-200 p-4 rounded mb-2 hover:bg-gray-50">
                          <strong>{formatParameterName(corr.parameter1)} và {formatParameterName(corr.parameter2)}:</strong>
                          {' '}{corrType} (r = {corr.correlation.toFixed(2)})
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Hourly Patterns Tab */}
        {activeTab === 'hourly' && (
          <div>
            {loading.hourly ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : errors.hourly ? (
              <div className="text-red-500 p-4 bg-red-50 rounded">{errors.hourly}</div>
            ) : !hourlyCharts ? (
              <p>Không có dữ liệu mẫu theo giờ.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="bg-green-600 text-white py-2 px-4 font-bold">
                    Nhiệt độ theo giờ
                  </div>
                  <div className="p-4 h-[300px]">
                    <Line
                      options={{
                        ...hourlyChartOptions,
                        plugins: {
                          ...hourlyChartOptions.plugins,
                          title: {
                            ...hourlyChartOptions.plugins.title,
                            text: 'Nhiệt độ trung bình theo giờ'
                          }
                        }
                      }}
                      data={hourlyCharts.temperature}
                    />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="bg-green-600 text-white py-2 px-4 font-bold">
                    Độ ẩm theo giờ
                  </div>
                  <div className="p-4 h-[300px]">
                    <Line
                      options={{
                        ...hourlyChartOptions,
                        plugins: {
                          ...hourlyChartOptions.plugins,
                          title: {
                            ...hourlyChartOptions.plugins.title,
                            text: 'Độ ẩm trung bình theo giờ'
                          }
                        }
                      }}
                      data={hourlyCharts.humidity}
                    />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="bg-green-600 text-white py-2 px-4 font-bold">
                    Độ ẩm đất theo giờ
                  </div>
                  <div className="p-4 h-[300px]">
                    <Line
                      options={{
                        ...hourlyChartOptions,
                        plugins: {
                          ...hourlyChartOptions.plugins,
                          title: {
                            ...hourlyChartOptions.plugins.title,
                            text: 'Độ ẩm đất trung bình theo giờ'
                          }
                        }
                      }}
                      data={hourlyCharts.soil}
                    />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="bg-green-600 text-white py-2 px-4 font-bold">
                    Cường độ ánh sáng theo giờ
                  </div>
                  <div className="p-4 h-[300px]">
                    <Line
                      options={{
                        ...hourlyChartOptions,
                        plugins: {
                          ...hourlyChartOptions.plugins,
                          title: {
                            ...hourlyChartOptions.plugins.title,
                            text: 'Cường độ ánh sáng trung bình theo giờ'
                          }
                        }
                      }}
                      data={hourlyCharts.lux}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Optimal Conditions Tab */}
        {activeTab === 'optimal' && (
          <div>
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="bg-green-600 text-white py-2 px-4 font-bold">
                Điều kiện môi trường tối ưu chung
              </div>
              <div className="p-4">
                {loading.optimal ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                ) : errors.optimal ? (
                  <div className="text-red-500 p-4 bg-red-50 rounded">{errors.optimal}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <h5 className="text-lg font-semibold mb-2">Nhiệt độ</h5>
                      <h4 className="text-xl mb-2">
                        {optimalData.general.temperature.optimal_range[0]}-{optimalData.general.temperature.optimal_range[1]}°C
                      </h4>
                      <p className="text-sm text-gray-600">{optimalData.general.temperature.description}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <h5 className="text-lg font-semibold mb-2">Độ ẩm</h5>
                      <h4 className="text-xl mb-2">
                        {optimalData.general.humidity.optimal_range[0]}-{optimalData.general.humidity.optimal_range[1]}%
                      </h4>
                      <p className="text-sm text-gray-600">{optimalData.general.humidity.description}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <h5 className="text-lg font-semibold mb-2">Độ ẩm đất</h5>
                      <h4 className="text-xl mb-2">
                        {optimalData.general.soil_moisture.optimal_range[0]}-{optimalData.general.soil_moisture.optimal_range[1]}%
                      </h4>
                      <p className="text-sm text-gray-600">{optimalData.general.soil_moisture.description}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <h5 className="text-lg font-semibold mb-2">Ánh sáng</h5>
                      <h4 className="text-xl mb-2">
                        {optimalData.general.lux.optimal_range[0]}-{optimalData.general.lux.optimal_range[1]} lux
                      </h4>
                      <p className="text-sm text-gray-600">{optimalData.general.lux.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-green-600 text-white py-2 px-4 font-bold">
                Điều kiện tối ưu theo loại cây
              </div>
              <div className="p-4">
                {loading.optimal ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                ) : errors.optimal ? (
                  <div className="text-red-500 p-4 bg-red-50 rounded">{errors.optimal}</div>
                ) : (
                  <div>
                    {Object.keys(optimalData)
                      .filter(key => key !== 'general')
                      .length === 0 ? (
                      <p>Không có thông tin về cây trồng.</p>
                    ) : (
                      Object.keys(optimalData)
                        .filter(key => key !== 'general')
                        .map(plant => {
                          const plantData = optimalData[plant];
                          return (
                            <div key={plant} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                              <div className="bg-gray-100 py-2 px-4">
                                <h5 className="font-semibold">{plant}</h5>
                              </div>
                              <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div>
                                    <p><strong>Nhiệt độ:</strong> {plantData.temperature.optimal_range[0]}-{plantData.temperature.optimal_range[1]}°C</p>
                                    <p className="text-sm text-gray-600">{plantData.temperature.description}</p>
                                  </div>
                                  <div>
                                    <p><strong>Độ ẩm:</strong> {plantData.humidity.optimal_range[0]}-{plantData.humidity.optimal_range[1]}%</p>
                                    <p className="text-sm text-gray-600">{plantData.humidity.description}</p>
                                  </div>
                                  <div>
                                    <p><strong>Độ ẩm đất:</strong> {plantData.soil_moisture.optimal_range[0]}-{plantData.soil_moisture.optimal_range[1]}%</p>
                                    <p className="text-sm text-gray-600">{plantData.soil_moisture.description}</p>
                                  </div>
                                  <div>
                                    <p><strong>Ánh sáng:</strong> {plantData.lux.optimal_range[0]}-{plantData.lux.optimal_range[1]} lux</p>
                                    <p className="text-sm text-gray-600">{plantData.lux.description}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Anomalies Tab */}
        {activeTab === 'anomalies' && (
          <div>
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="bg-green-600 text-white py-2 px-4 font-bold">
                Phát hiện dữ liệu bất thường
              </div>
              <div className="p-4">
                {loading.anomalies ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                ) : errors.anomalies ? (
                  <div className="text-red-500 p-4 bg-red-50 rounded">{errors.anomalies}</div>
                ) : (
                  <div className={`p-4 rounded-lg ${anomalyData.total_anomalies > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                    <h5 className="font-semibold mb-2">{anomalyData.total_anomalies} điểm dữ liệu bất thường được phát hiện</h5>
                    <p>
                      {anomalyData.total_anomalies > 0 
                        ? 'Các điểm dữ liệu bất thường có thể chỉ ra vấn đề với hệ thống cảm biến hoặc điều kiện môi trường đặc biệt.' 
                        : 'Không phát hiện dữ liệu bất thường trong 7 ngày gần đây.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-green-600 text-white py-2 px-4 font-bold">
                Danh sách dữ liệu bất thường
              </div>
              <div className="p-4">
                {loading.anomalies ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                ) : errors.anomalies ? (
                  <div className="text-red-500 p-4 bg-red-50 rounded">{errors.anomalies}</div>
                ) : anomalyData.anomalies.length === 0 ? (
                  <p>Không có dữ liệu bất thường.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-2 text-left">Thời gian</th>
                          <th className="border border-gray-300 p-2 text-left">Thông số</th>
                          <th className="border border-gray-300 p-2 text-left">Giá trị</th>
                          <th className="border border-gray-300 p-2 text-left">Lý do</th>
                        </tr>
                      </thead>
                      <tbody>
                        {anomalyData.anomalies.map((anomaly, index) => {
                          const timestamp = new Date(anomaly.timestamp).toLocaleString();
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 p-2">{timestamp}</td>
                              <td className="border border-gray-300 p-2">{formatParameterName(anomaly.parameter)}</td>
                              <td className="border border-gray-300 p-2">{anomaly.value}</td>
                              <td className="border border-gray-300 p-2">{anomaly.reason}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>        )}
      </div>
    </div>
  );
}

export default AnalystDetail;
