import React, { useState } from 'react';
import { Modal, Upload, message, Button } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Dragger } = Upload;

const FileUploadModal = ({ visible, onCancel, onUploadSuccess }) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  const props = {
    name: 'file',
    multiple: false,
    accept: '.csv',
    fileList,
    beforeUpload: (file) => {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        message.error('You can only upload CSV files!');
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      return false; // Prevent auto upload
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Please select a CSV file first!');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileList[0]);
    
    setUploading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData);
      
      setUploading(false);
      setFileList([]);
      
      message.success(`${response.data.message}: ${response.data.count} records processed in new collection: ${response.data.collection}`);
      
      // Call the parent component's success handler
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      
      onCancel();
    } catch (error) {
      setUploading(false);
      console.error('Upload error:', error);
      message.error('Upload failed. Please try again.');
    }
  };

  return (
    <Modal
      title="Upload CSV File"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={uploading}
          onClick={handleUpload}
        >
          Upload
        </Button>,
      ]}
    >
      <Dragger {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag CSV file to this area to upload</p>
        <p className="ant-upload-hint">
          The CSV file will be uploaded to a new collection. Each upload creates a separate dataset.
        </p>
      </Dragger>
    </Modal>
  );
};

export default FileUploadModal; 