import { useState, useEffect } from "react";
import axios from "axios";

export default function Device() {
  const [devices, setDevices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({ device_name: "" });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = () => {
    axios.get("http://localhost:5000/api/devices")
      .then((res) => setDevices(res.data))
      .catch((error) => console.error("Lỗi khi lấy dữ liệu thiết bị:", error));
  };

  const handleAddDevice = () => {
    axios.post("http://localhost:5000/api/devices", newDevice)
      .then(() => {
        fetchDevices();
        setIsModalOpen(false);
        setNewDevice({ device_name: "" });
      })
      .catch((error) => console.error("Lỗi khi thêm thiết bị:", error));
  };

  const handleDeleteDevice = (id) => {
    axios.delete(`http://localhost:5000/api/devices/${id}`)
      .then(() => {
        fetchDevices();
      })
      .catch((error) => console.error("Lỗi khi xóa thiết bị:", error));
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Danh sách thiết bị</h1>
      <div className="flex justify-end mb-4">
        <button onClick={() => setIsModalOpen(true)} className="bg-[#E8FFE8] px-4 py-2 flex items-center gap-2 rounded-lg shadow">
          Thêm thiết bị
        </button>
      </div>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Tên thiết bị</th>
            <th className="border p-2">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <tr key={device.id} className="border">
              <td className="border p-2">{device.id}</td>
              <td className="border p-2">{device.device_name}</td>
              <td className="border p-2">
                <button className="px-3 py-1 bg-red-100 text-red-600 rounded-md" onClick={() => handleDeleteDevice(device.id)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Thêm thiết bị</h2>
            <input type="text" placeholder="Tên thiết bị" className="w-full border p-2 rounded mb-4" value={newDevice.device_name} onChange={(e) => setNewDevice({ device_name: e.target.value })} />
            <div className="flex justify-end space-x-2">
              <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setIsModalOpen(false)}>Hủy</button>
              <button className="bg-green-300 text-black px-4 py-2 rounded" onClick={handleAddDevice}>Thêm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}