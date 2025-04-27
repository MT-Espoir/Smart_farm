import React, { useEffect, useState } from "react";
import axios from "axios";

function FetchData() {
    const [data, setData] = useState([]);

    useEffect(() => {
        // Use the API instead of static JSON file
        axios.get("http://localhost:5000/api/sensor_data")
        .then(res => setData(res.data))
        .catch(err => console.log(err));
    }, []);

    return (
        <div className="p-4">
            <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border p-2">Thời gian</th>
                        <th className="border p-2">Nhiệt độ (°C)</th>
                        <th className="border p-2">Độ ẩm (%)</th>
                        <th className="border p-2">Độ ẩm đất (%)</th>
                        <th className="border p-2">Ánh sáng (lux)</th>
                        <th className="border p-2">Trạng thái bơm</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index} className="text-center">
                            <td className="border p-2">{new Date(row.timestamp).toLocaleString()}</td>
                            <td className="border p-2">{row.temperature}</td>
                            <td className="border p-2">{row.humidity}</td>
                            <td className="border p-2">{row.soil_moisture}</td>
                            <td className="border p-2">{row.lux}</td>
                            <td className="border p-2">
                                {row.pump_status ? (
                                    <span className="text-green-600">Bật</span>
                                ) : (
                                    <span className="text-red-600">Tắt</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default FetchData;