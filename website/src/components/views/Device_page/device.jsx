import { useState, useEffect } from "react";
import axios from "axios";

export default function Device() {
  const [devices, setDevices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({ device_name: "", state: "active" });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/devices");
      setDevices(res.data);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu thiết bị:", error);
    }
  };

  const handleAddDevice = async () => {
    if (!newDevice.device_name.trim()) {
      alert("Tên thiết bị không được để trống!");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/devices", {
        ...newDevice,
        state: newDevice.state || "active", // Đảm bảo state không null
      });
      fetchDevices();
      setIsModalOpen(false);
      setNewDevice({ device_name: "", state: "active" });
    } catch (error) {
      console.error("Lỗi khi thêm thiết bị:", error);
    }
  };

  const handleDeleteDevice = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/devices/${id}`);
      fetchDevices();
    } catch (error) {
      console.error("Lỗi khi xóa thiết bị:", error);
    }
  };

  const getStatusStyle = (state) => {
    const statusClasses = {
      active: "bg-green-100 text-green-600",
      repair: "bg-blue-100 text-blue-600",
      error: "bg-red-100 text-red-600",
    };
    return `${statusClasses[state] || "bg-gray-100 text-gray-600"} px-3 py-1 rounded-lg`;
  };

  return (
    <div className="p-4 font-Roboto">
      <h1 className="text-2xl font-bold mb-4">Danh sách thiết bị</h1>
      <div className="flex justify-end mb-4">
        <button onClick={() => setIsModalOpen(true)} className="bg-[#E8FFE8] px-4 py-2 rounded-lg shadow">
          Thêm thiết bị
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-lg shadow-md">
          <thead className="bg-green-100 text-gray-700">
            <tr>
              <th className="py-3 px-4 text-left">Device ID</th>
              <th className="py-3 px-4 text-left">Tên thiết bị</th>
              <th className="py-3 px-4 text-left">Trạng thái</th>
              <th className="py-3 px-4 text-left">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id} className="border-b border-gray-200">
                <td className="py-3 px-4">{device.id}</td>
                <td className="py-3 px-4 font-bold">{device.device_name}</td>
                <td className="py-3 px-4">
                  <span className={getStatusStyle(device.state)}>{device.state}</span>
                </td>
                <td className="py-3 px-4">
                  <button className="px-3 py-1 bg-red-100 text-red-600 rounded-md" onClick={() => handleDeleteDevice(device.id)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Thêm thiết bị</h2>
            <input
              type="text"
              placeholder="Tên thiết bị"
              className="w-full border p-2 rounded mb-4"
              value={newDevice.device_name}
              onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
            />
            <div className="flex justify-end space-x-2">
              <button className="bg-white border px-4 py-2 rounded" onClick={() => setIsModalOpen(false)}>Hủy</button>
              <button className="bg-mint text-black px-4 py-2 rounded" onClick={handleAddDevice}>Thêm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
