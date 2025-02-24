import React, { useState, useEffect } from 'react';
import './healthcare.css';
import DiseaseDetailPage from './DiseaseDetailPage.jsx';

const API_BASE_URL = 'http://localhost:5000'; // Thêm dòng này ở đầu component

const Healthcare = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 4;

  // State cho thông báo
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  // State cho modal chi tiết

  const [showDetailPage, setShowDetailPage] = useState(false);

  const handleImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          // Don't set Content-Type header when using FormData
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setImages(prev => [...prev, data]);
      
      setNotification({
        show: true,
        message: 'Image uploaded successfully',
        type: 'success'
      });
    } catch (error) {
      setNotification({
        show: true,
        message: error.message,
        type: 'error'
      });
    }
  };

  
  const handleDeleteImage = async (imageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/delete-image/${imageId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Delete failed');

      setImages(prev => prev.filter(img => img.id !== imageId));
      
      setNotification({
        show: true,
        message: 'Image deleted successfully',
        type: 'success'
      });
    } catch (error) {
      setNotification({
        show: true,
        message: error.message,
        type: 'error'
      });
    }
  };
  // Upload Area Component
const UploadArea = ({ onImageUpload }) => {
    const [dragActive, setDragActive] = useState(false);
    
    const handleDrag = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };
  
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      const files = e.dataTransfer.files;
      handleFiles(files);
    };
  
    const handleFiles = (files) => {
      const validFiles = Array.from(files).filter(file => 
        file.type.match('image.*') && file.size <= 5000000
      );
  
      if (validFiles.length !== files.length) {
        setNotification({
          show: true,
          message: 'Some files were rejected. Please only upload images under 5MB.',
          type: 'error'
        });
      }
  
      validFiles.forEach(file => onImageUpload(file));
    };
  
    return (
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          type="file"
          id="file-input"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
        <p>Nhấn vào đây để upload ảnh</p>
      </div>
    );
  };
  
  // Image Card Component
  const ImageCard = ({ image, onDelete, onShowDetail }) => {
    return (
      <div className="image-card">
        <div className="image-wrapper" onClick={onShowDetail}>
          <img 
            src={`${API_BASE_URL}${image.url}`} 
            alt={image.name} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'placeholder.png';
            }}
          />
          {image.prediction && (
            <div className="prediction-info">
              <p className="disease-label">Bệnh: {image.prediction.label}</p>
              <p className="confidence">
                Dự đoán: {(image.prediction.confidence * 100).toFixed(2)}%
              </p>
            </div>
          )}
        </div>
        {image.prediction && (
          <div className="image-card-actions">
            <button onClick={() => onDelete(image.id)} className="delete-btn">
              Xóa
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Notification Component
  const Notification = ({ message, type, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }, [onClose]);
  
    return (
      <div className={`notification ${type}`}>
        {message}
      </div>
    );
  };

  // Thêm useEffect để load ảnh khi component mount
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/images`);
        if (!response.ok) throw new Error('Failed to fetch images');
        const data = await response.json();
        setImages(data);
      } catch (error) {
        setNotification({
          show: true,
          message: error.message,
          type: 'error'
        });
      }
    };

    fetchImages();
  }, []);

  // Pagination logic
  const indexOfLastImage = currentPage * imagesPerPage;
  const indexOfFirstImage = indexOfLastImage - imagesPerPage;
  const currentImages = images.slice(indexOfFirstImage, indexOfLastImage);

  // Xử lý khi click vào nút chi tiết
  const handleShowDetail = (image) => {
    setSelectedImage({
      ...image,
      fullUrl: `${API_BASE_URL}${image.url}`
    });
    setShowDetailPage(true);
  };

  // Nếu đang ở trang chi tiết, hiển thị DiseaseDetailPage
  if (showDetailPage && selectedImage) {
    return (
      <DiseaseDetailPage
        image={selectedImage}
        onBack={() => {
          setShowDetailPage(false);
          setSelectedImage(null);
        }}
      />
    );
  }

  // Main page render
  return (
    <div className="healthcare-container">
      <section className="upload-section">
        <h2>Upload Plant Images</h2>
        <UploadArea onImageUpload={handleImageUpload} />
      </section>

      <section className="history-section">
        <h2>Image History</h2>
        <div className="image-grid">
          {currentImages.map(image => (
            <ImageCard
              key={image.id}
              image={image}
              onDelete={handleDeleteImage}
              onShowDetail={() => handleShowDetail(image)}
            />
          ))}
        </div>
        
        {/* Pagination controls */}
        <div className="pagination">
          <button className='prev-btn'
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span>{currentPage}</span>
          <button className='next-btn'
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={indexOfLastImage >= images.length}
          >
            Next
          </button>
        </div>
      </section>

      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}
    </div>
  );
};



export default Healthcare;