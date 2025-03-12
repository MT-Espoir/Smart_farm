import { useState, useEffect } from "react";
import axios from "axios";

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const csv = require("csv-parser");

const app = express();
app.use(cors());

app.get("/data", (req, res) => {
    const results = [];
    fs.createReadStream("sensor_data.csv")
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => {
            res.json(results);
        });
});

app.listen(5002, () => console.log("Server running on port 5002"));


const SensorTable = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:5002/data").then((response) => {
            setData(response.data);
        });
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
                                {row.pump_status === "1" ? (
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
};

export default SensorTable;
