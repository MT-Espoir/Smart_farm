import React, { useState } from 'react';
import './healthcare.css';

const API_BASE_URL = 'http://localhost:5000'; // Add this line

const diseaseDetails = {
  'Pepper__bell___Bacterial_spot': {
    description: "Bệnh đốm vi khuẩn trên ớt chuông, thường xuất hiện trong điều kiện ẩm ướt.",
    causes: [
      "Độ ẩm không khí cao (>80%)",
      "Nhiệt độ thích hợp (20-30°C)",
      "Thiếu dinh dưỡng",
      "Đất trồng không thoát nước"
    ],
    solutions: [
      "Phun thuốc phòng trừ vi khuẩn",
      "Cải thiện thoát nước",
      "Bổ sung dinh dưỡng cho cây",
      "Giảm độ ẩm môi trường"
    ]
  },
  'Potato___Early_blight': {
    description: "Bệnh sớm (Early Blight) là một trong những bệnh phổ biến trên khoai tây, do nấm Alternaria solani gây ra. Bệnh thường xuất hiện trên lá già trước, sau đó lan dần lên các bộ phận khác của cây. Nếu không kiểm soát, bệnh có thể làm giảm năng suất và chất lượng khoai tây đáng kể.",
    causes: [
        "Độ ẩm cao (trên 90%) và nhiệt độ từ 24–29°C",
        "Cây thiếu dinh dưỡng, đặc biệt là kali và đạm",
        "Sự thay đổi thất thường của thời tiết, đặc biệt là sau các đợt mưa.",
        "Tàn dư cây bệnh từ vụ trước không được dọn sạch.",
        "Sử dụng giống khoai tây kém kháng bệnh."
        ],
    solutions: [
        "Luân canh cây trồng, tránh trồng khoai tây liên tiếp trên cùng một diện tích.",
        "Chọn giống khoai tây có khả năng kháng bệnh tốt.",
        "Vệ sinh đồng ruộng, tiêu hủy tàn dư cây bệnh sau mỗi vụ.",
        "Bón phân cân đối, đặc biệt bổ sung kali và canxi để tăng sức đề kháng.",
        "Sử dụng chế phẩm sinh học chứa vi khuẩn Bacillus subtilis hoặc Trichoderma để hạn chế sự phát triển của nấm.",
        "Sử dụng thuốc trừ nấm khi bệnh xuất hiện, các loại thuốc phổ biến gồm: Mancozeb, Chlorothalonil, Azoxystrobin + Difenoconazole",
    ],
  },
  // Thêm thông tin cho các loại bệnh khác tương tự
};

const DiseaseDetailPage = ({ image, onBack }) => {
  const [note, setNote] = useState('');
  const [treatments, setTreatments] = useState([]);

  const diseaseInfo = diseaseDetails[image.prediction.label] || {
    description: "Thông tin bệnh không có sẵn.",
    causes: [],
    solutions: []
  };

  return (
    <div className="disease-detail-page">
      <div className="detail-container">
        {/* Left Panel */}
        <div className="left-panel">
          <div className="image-container">
            <img 
              src={`${API_BASE_URL}${image.url}`} 
              alt={image.name}
              className="disease-image" 
            />
          </div>
          <div className="prediction-info1">
            <h3>Kết quả dự đoán</h3>
            <p className="disease-name">Bệnh: {image.prediction.label}</p>
            <p className="confidence1">
              Độ tin cậy: {(image.prediction.confidence * 100).toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <div className="disease-info-container">
            <section className="info-section">
              <h3>Thông tin bệnh</h3>
              <p>{diseaseInfo.description}</p>
            </section>

            <section className="info-section">
              <h3>Nguyên nhân</h3>
              <ul>
                {diseaseInfo.causes.map((cause, index) => (
                  <li key={index}>{cause}</li>
                ))}
              </ul>
            </section>

            <section className="info-section">
              <h3>Giải pháp đề xuất</h3>
              <ul>
                {diseaseInfo.solutions.map((solution, index) => (
                  <li key={index}>{solution}</li>
                ))}
              </ul>
            </section>

            <section className="treatment-section">
              <button className="back-btn" onClick={onBack}>
                Quay lại
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseaseDetailPage;