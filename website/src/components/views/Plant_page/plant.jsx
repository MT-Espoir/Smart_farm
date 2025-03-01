import React, { useState } from "react";
import '../../assests/css/output.css'; // Import Tailwind CSS

const plants = [
  { id: "1", name: "Cà rốt", plantDate: "20.02.2025", harvestDate: "20.05.2025", status: "Đang trồng" },
  { id: "2", name: "Cà rốt", plantDate: "20.02.2025", harvestDate: "20.05.2025", status: "Đang trồng" },
  { id: "3", name: "Cà rốt", plantDate: "20.02.2025", harvestDate: "20.05.2025", status: "Đang trồng" },
  { id: "4", name: "Bắp cải", plantDate: "20.02.2025", harvestDate: "20.05.2025", status: "Thu hoạch" },
  { id: "5", name: "Cà chua", plantDate: "20.02.2025", harvestDate: "20.05.2025", status: "Quá hạn" },
];

const statusColors = {
  "Đang trồng": "bg-blue-100 text-blue-600",
  "Thu hoạch": "bg-green-100 text-green-600",
  "Quá hạn": "bg-red-100 text-red-600",
};

function PlantPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(plants.length / itemsPerPage);
  const displayedPlants = plants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 font-Roboto">
      {/* Nút thêm cây trồng */}
      <div className="flex justify-end mb-4">
        <button className="bg-[#E8FFE8] px-4 py-2 flex items-center gap-2 rounded-lg shadow">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
            />
          </svg>
          Thêm cây trồng
        </button>
      </div>

      {/* Bảng danh sách cây */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-lg shadow-md">
          <thead className="bg-[#E8FFE8] text-gray-700">
            <tr>
              <th className="py-3 px-4 text-left">Plant ID</th>
              <th className="py-3 px-4 text-left">Tên cây</th>
              <th className="py-3 px-4 text-left">Ngày trồng</th>
              <th className="py-3 px-4 text-left">Ngày thu hoạch</th>
              <th className="py-3 px-4 text-left">Trạng thái</th>
              <th className="py-3 px-4 text-left">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {displayedPlants.map((plant) => (
              <tr key={plant.id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-4 flex items-center">
                  {/* <input type="checkbox" className="mr-2" /> */}
                  {plant.id}
                </td>
                <td className="py-3 px-4">{plant.name}</td>
                <td className="py-3 px-4">{plant.plantDate}</td>
                <td className="py-3 px-4">{plant.harvestDate}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-md text-sm font-medium ${statusColors[plant.status]}`}>
                    {plant.status}
                  </span>
                </td>
                <td className="py-3 px-4 space-x-2">
                  <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md">Chi tiết</button>
                  <button className="px-3 py-1 bg-red-100 text-red-600 rounded-md">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <span>Show rows: {itemsPerPage} items</span>
        <div className="flex space-x-2">
          <button
            className="px-3 py-1 bg-gray-200 rounded-md"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            ◀
          </button>
          <span className="px-3 py-1 bg-gray-300 rounded-md">{currentPage}</span>
          <button
            className="px-3 py-1 bg-gray-200 rounded-md"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlantPage;
