// import React, { useEffect, useState } from "react";
// import axios from "axios";
// // import '../../assests/css/output.css'; // Import Tailwind CSS

// const statusColors = {
//   "Chưa trồng": "bg-yellow-100 text-yellow-600",
//   "Đang trồng": "bg-blue-100 text-blue-600",
//   "Quá hạn": "bg-red-100 text-red-600",
//   "Thu hoạch": "bg-green-100 text-green-600",
// };

// function getStatus(startDate, endDate) {
//   const today = new Date();
//   const start = new Date(startDate.split('-').reverse().join('-'));
//   const end = new Date(endDate.split('-').reverse().join('-'));

//   if (today < start) return "Chưa trồng";
//   if (today >= start && today < end) return "Đang trồng";
//   if (today >= end) return "Thu hoạch";
//   // if (today === end) return "Thu hoạch";
//   return "Không xác định";
// }

// function PlantPage() {
//   const [plants, setPlants] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [newPlant, setNewPlant] = useState({ plant_name: "", start_date: "", end_date: "" });
//   const itemsPerPage = 5;

//   useEffect(() => {
//     fetchPlants();
//   }, []);

//   const fetchPlants = () => {
//     axios.get("http://localhost:5000/plants")
//       .then((response) => setPlants(response.data))
//       .catch((error) => console.error("Lỗi khi lấy dữ liệu cây trồng:", error));
//   };

//   const handleAddPlant = () => {
//     axios.post("http://localhost:5000/plants", newPlant)
//       .then(() => {
//         fetchPlants();
//         setIsModalOpen(false);
//         setNewPlant({ plant_name: "", start_date: "", end_date: "" });
//       })
//       .catch((error) => console.error("Lỗi khi thêm cây trồng:", error));
//   };

//   const handleDeletePlant = (id) => {
//     axios.delete(`http://localhost:5000/plants/${id}`)
//       .then(() => {
//         fetchPlants();
//       })
//       .catch((error) => console.error("Lỗi khi xóa cây trồng:", error));
//   };

//   const totalPages = Math.ceil(plants.length / itemsPerPage);
//   const displayedPlants = plants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   return (
//     <div className="p-6 font-Roboto">
//       <div className="flex justify-end mb-4">
//         <button onClick={() => setIsModalOpen(true)} className="bg-[#E8FFE8] px-4 py-2 flex items-center gap-2 rounded-lg shadow">
//           Thêm cây trồng
//         </button>
//       </div>

//       <div className="overflow-x-auto">
//         <table className="overflow-hidden w-full border border-gray-200 rounded-lg shadow-md">
//           <thead className="bg-mint text-gray-700 rounded-t-lg">
//             <tr>
//               <th className="py-3 px-4 text-left">Plant ID</th>
//               <th className="py-3 px-4 text-left">Tên cây</th>
//               <th className="py-3 px-4 text-left">Ngày trồng</th>
//               <th className="py-3 px-4 text-left">Ngày thu hoạch</th>
//               <th className="py-3 px-4 text-left">Trạng thái</th>
//               <th className="py-3 px-4 text-left">Thao tác</th>
//             </tr>
//           </thead>
//           <tbody>
//             {displayedPlants.map((plant) => {
//               const status = getStatus(plant.start_date, plant.end_date);
//               return (
//                 <tr key={plant.id} className="border-b border-gray-200">
//                   <td className="py-3 px-4">{plant.id}</td>
//                   <td className="py-3 px-4">{plant.plant_name}</td>
//                   <td className="py-3 px-4">{plant.start_date}</td>
//                   <td className="py-3 px-4">{plant.end_date}</td>
//                   <td className="py-3 px-4">
//                     <span className={`px-3 py-1 rounded-md text-sm font-medium ${statusColors[status] || "bg-gray-200 text-gray-600"}`}>
//                       {status}
//                     </span>
//                   </td>
//                   <td className="py-3 px-4 space-x-2">
//                     <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md" onClick={() => isDetailModalOpen(true)}>Chi tiết</button>
//                     <button className="px-3 py-1 bg-red-100 text-red-600 rounded-md" onClick={() => handleDeletePlant(plant.id)}>Xóa</button>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       <div className="flex items-center justify-between mt-4">
//         <span>Show rows: {itemsPerPage} items</span>
//         <div className="flex space-x-2">
//           <button className="px-3 py-1 bg-gray-200 rounded-md" disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>◀</button>
//           <span className="px-3 py-1 bg-gray-300 rounded-md">{currentPage}</span>
//           <button className="px-3 py-1 bg-gray-200 rounded-md" disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}>▶</button>
//         </div>
//       </div>

//       {isModalOpen && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
//           <div className="bg-white p-6 rounded-lg shadow-lg w-96">
//             <h2 className="text-lg font-bold mb-4">Thêm cây trồng</h2>
//             <input type="text" placeholder="Tên cây" className="w-full border p-2 rounded mb-2" value={newPlant.plant_name} onChange={(e) => setNewPlant({ ...newPlant, plant_name: e.target.value })} />
//             <input type="date" placeholder="Ngày trồng" className="w-full border p-2 rounded mb-2" value={newPlant.start_date} onChange={(e) => setNewPlant({ ...newPlant, start_date: e.target.value })} />
//             <input type="date" placeholder="Ngày thu hoạch" className="w-full border p-2 rounded mb-4" value={newPlant.end_date} onChange={(e) => setNewPlant({ ...newPlant, end_date: e.target.value })} />
//             <div className="flex justify-end space-x-2">
//               <button className="bg-white px-4 py-2 rounded border" onClick={() => setIsModalOpen(false)}>Hủy</button>
//               <button className="bg-mint text-black px-4 py-2 rounded" onClick={handleAddPlant}>Thêm</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default PlantPage;


import React, { useEffect, useState } from "react";
import axios from "axios";
// import '../../assests/css/output.css'; // Import Tailwind CSS

const statusColors = {
  "Chưa trồng": "bg-yellow-100 text-yellow-600",
  "Đang trồng": "bg-blue-100 text-blue-600",
  "Quá hạn": "bg-red-100 text-red-600",
  "Thu hoạch": "bg-green-100 text-green-600",
};

function getStatus(startDate, endDate) {
  const today = new Date();
  const start = new Date(startDate.split('-').reverse().join('-'));
  const end = new Date(endDate.split('-').reverse().join('-'));

  if (today < start) return "Chưa trồng";
  if (today >= start && today < end) return "Đang trồng";
  if (today >= end) return "Thu hoạch";
  // if (today === end) return "Thu hoạch";
  return "Không xác định";
}

function PlantPage() {
  const [plants, setPlants] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlant, setNewPlant] = useState({ plant_name: "", start_date: "", end_date: "" });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPlant, setCurrentPlant] = useState(null);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = () => {
    axios.get("http://localhost:5000/plants")
      .then((response) => setPlants(response.data))
      .catch((error) => console.error("Lỗi khi lấy dữ liệu cây trồng:", error));
  };

  const handleAddPlant = () => {
    axios.post("http://localhost:5000/plants", newPlant)
      .then(() => {
        fetchPlants();
        setIsModalOpen(false);
        setNewPlant({ plant_name: "", start_date: "", end_date: "" });
      })
      .catch((error) => console.error("Lỗi khi thêm cây trồng:", error));
  };

  const handleDeletePlant = (id) => {
    axios.delete(`http://localhost:5000/plants/${id}`)
      .then(() => {
        fetchPlants();
      })
      .catch((error) => console.error("Lỗi khi xóa cây trồng:", error));
  };

  const handleOpenDetailModal = (plant) => {
    setCurrentPlant(plant);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setCurrentPlant(null);
  };

  const totalPages = Math.ceil(plants.length / itemsPerPage);
  const displayedPlants = plants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 font-Roboto">
      <div className="flex justify-end mb-4">
        <button onClick={() => setIsModalOpen(true)} className="bg-[#E8FFE8] px-4 py-2 flex items-center gap-2 rounded-lg shadow">
          Thêm cây trồng
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="overflow-hidden w-full border border-gray-200 rounded-lg shadow-md">
          <thead className="bg-mint text-gray-700 rounded-t-lg">
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
            {displayedPlants.map((plant) => {
              const status = getStatus(plant.start_date, plant.end_date);
              return (
                <tr key={plant.id} className="border-b border-gray-200">
                  <td className="py-3 px-4">{plant.id}</td>
                  <td className="py-3 px-4">{plant.plant_name}</td>
                  <td className="py-3 px-4">{plant.start_date}</td>
                  <td className="py-3 px-4">{plant.end_date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-md text-sm font-medium ${statusColors[status] || "bg-gray-200 text-gray-600"}`}>
                      {status}
                    </span>
                  </td>
                  <td className="py-3 px-4 space-x-2">
                    <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md" onClick={() => handleOpenDetailModal(plant)}>Chi tiết</button>
                    <button className="px-3 py-1 bg-red-100 text-red-600 rounded-md" onClick={() => handleDeletePlant(plant.id)}>Xóa</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span>Show rows: {itemsPerPage} items</span>
        <div className="flex space-x-2">
          <button className="px-3 py-1 bg-gray-200 rounded-md" disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>◀</button>
          <span className="px-3 py-1 bg-gray-300 rounded-md">{currentPage}</span>
          <button className="px-3 py-1 bg-gray-200 rounded-md" disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}>▶</button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Thêm cây trồng</h2>
            <input type="text" placeholder="Tên cây" className="w-full border p-2 rounded mb-2" value={newPlant.plant_name} onChange={(e) => setNewPlant({ ...newPlant, plant_name: e.target.value })} />
            <input type="date" placeholder="Ngày trồng" className="w-full border p-2 rounded mb-2" value={newPlant.start_date} onChange={(e) => setNewPlant({ ...newPlant, start_date: e.target.value })} />
            <input type="date" placeholder="Ngày thu hoạch" className="w-full border p-2 rounded mb-4" value={newPlant.end_date} onChange={(e) => setNewPlant({ ...newPlant, end_date: e.target.value })} />
            <div className="flex justify-end space-x-2">
              <button className="bg-white px-4 py-2 rounded border" onClick={() => setIsModalOpen(false)}>Hủy</button>
              <button className="bg-mint text-black px-4 py-2 rounded" onClick={handleAddPlant}>Thêm</button>
            </div>
          </div>
        </div>
      )}

      {isDetailModalOpen && currentPlant && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Chi tiết cây trồng</h2>
            <p><strong>Tên cây:</strong> {currentPlant.plant_name}</p>
            <p><strong>Ngày trồng:</strong> {currentPlant.start_date}</p>
            <p><strong>Ngày thu hoạch:</strong> {currentPlant.end_date}</p>
            <div className="flex justify-end space-x-2 mt-4">
              <button className="bg-white px-4 py-2 rounded border" onClick={handleCloseDetailModal}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlantPage;