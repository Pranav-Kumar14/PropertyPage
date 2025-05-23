import React, { useState } from "react";
import axios from "axios";
import JsonViewer from "./JSONViewer";
import "./Upload.css";

const UploadJSON = () => {
  const [fileContent, setFileContent] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadedId, setUploadedId] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          setFileContent(json);
        } catch (err) {
          alert("Invalid JSON file.");
        }
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a valid JSON file.");
    }
  };

  const handleUpload = async () => {
    if (!fileContent) {
      alert("No file content to upload.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:4000/upload", fileContent);
      setUploadStatus("Upload successful!");
      setUploadedId(res.data._id);
    } catch (error) {
      console.error(error);
      setUploadStatus("Upload failed.");
    }
  };

  return (
    <div className="upload-container">
      <h2 className="upload-title">Upload Hotel JSON</h2>
      <input
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="upload-input"
      />
      <button onClick={handleUpload} className="upload-button">
        Upload
      </button>
      {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
      {uploadedId && <JsonViewer id={uploadedId} />}
    </div>
  );
};

export default UploadJSON;
