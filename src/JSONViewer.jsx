import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Viewer.css";

const JsonViewer = ({ id }) => {
  const [property, setProperty] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [username, setUsername] = useState("admin");
  const [expandedArrays, setExpandedArrays] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/property/${id}`);
        setProperty(res.data);
      } catch (err) {
        console.error("Error fetching property:", err);
      }
    };
    fetchData();
  }, [id]);

  const handleFieldChange = (section, keyPath, value) => {
    setProperty((prev) => {
      const updated = { ...prev };
      const keys = keyPath.split(".");
      let pointer = updated[section];

      for (let i = 0; i < keys.length - 1; i++) {
        if (!pointer[keys[i]]) pointer[keys[i]] = {};
        pointer = pointer[keys[i]];
      }
      pointer[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleSave = async (section, keyPath, oldValue, newValue) => {
    try {
      await axios.put(`http://localhost:4000/property/${id}`, {
        updates: property,
        username,
      });
      console.log("Change logged:", section, keyPath, oldValue, newValue);
      alert("Change saved successfully.");
    } catch (err) {
      console.error("Error saving update:", err);
    }
  };

  const handleDeleteArrayItem = (section, key, index) => {
    const oldValue = property[section][key][index];
    const newArray = [...property[section][key]];
    newArray.splice(index, 1);

    setProperty((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: newArray,
      },
    }));

    handleSave(section, `${key}.${index}`, oldValue, null);
  };

  const handleInsertArrayItem = (section, key) => {
    const newArray = [...property[section][key], ""];
    setProperty((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: newArray,
      },
    }));
  };

  const toggleArrayView = (section, key) => {
    const fullKey = `${section}.${key}`;
    setExpandedArrays((prev) => ({
      ...prev,
      [fullKey]: !prev[fullKey],
    }));
  };

  if (!property) return <div className="loading">Loading...</div>;

  const sectionKeys = Object.keys(property).filter(
    (section) => section !== "_id" && typeof property[section] === "object"
  );

  const currentSectionKey = sectionKeys[currentSectionIndex];
  const currentSection = property[currentSectionKey];

  return (
    <div className="json-viewer-container">
      <h2 className="title">Edit Property: {currentSectionKey}</h2>

      <div className="section-card">
        <div className="section-body">
          {Object.entries(currentSection).map(([key, value]) => {
            if (Array.isArray(value)) {
              const isExpanded =
                expandedArrays[`${currentSectionKey}.${key}`] ?? true;

              return (
                <div key={key} className="field-group">
                  <label className="field-label">
                    {key}
                    <button
                      onClick={() => toggleArrayView(currentSectionKey, key)}
                      className="toggle-view-button"
                    >
                      {isExpanded ? "Compact View" : "Expanded View"}
                    </button>
                  </label>

                  {isExpanded ? (
                    <>
                      {value.map((item, index) => (
                        <div key={index} className="array-item-wrapper">
                          <input
                            type="text"
                            value={item}
                            className="field-input array-item"
                            onChange={(e) => {
                              const newArray = [...value];
                              newArray[index] = e.target.value;
                              handleFieldChange(
                                currentSectionKey,
                                key,
                                newArray
                              );
                            }}
                          />
                          <button
                            className="delete-button"
                            onClick={() =>
                              handleDeleteArrayItem(
                                currentSectionKey,
                                key,
                                index
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                      <button
                        className="insert-button"
                        onClick={() =>
                          handleInsertArrayItem(currentSectionKey, key)
                        }
                      >
                        Insert New Item
                      </button>
                    </>
                  ) : (
                    <textarea
                      className="field-textarea"
                      value={value.join(", ")}
                      onChange={(e) =>
                        handleFieldChange(
                          currentSectionKey,
                          key,
                          e.target.value.split(",").map((v) => v.trim())
                        )
                      }
                    />
                  )}
                </div>
              );
            } else if (typeof value === "object") {
              return (
                <div key={key} className="nested-section">
                  <div className="nested-title">{key}</div>
                  {Object.entries(value).map(([subKey, subValue]) => (
                    <div key={subKey} className="field-group">
                      <label className="field-label">{subKey}</label>
                      <input
                        type="text"
                        value={subValue}
                        className="field-input"
                        onChange={(e) =>
                          handleFieldChange(
                            currentSectionKey,
                            `${key}.${subKey}`,
                            e.target.value
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              );
            } else {
              return (
                <div key={key} className="field-group">
                  <label className="field-label">{key}</label>
                  <input
                    type="text"
                    value={value}
                    className="field-input"
                    onChange={(e) =>
                      handleFieldChange(currentSectionKey, key, e.target.value)
                    }
                  />
                </div>
              );
            }
          })}

          <button
            className="save-button section-save"
            onClick={() =>
              handleSave(
                currentSectionKey,
                "",
                {}, // No per-field oldValue
                property[currentSectionKey]
              )
            }
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="nav-buttons">
        <button
          onClick={() => setCurrentSectionIndex((i) => i - 1)}
          disabled={currentSectionIndex === 0}
          className="nav-button"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentSectionIndex((i) => i + 1)}
          disabled={currentSectionIndex === sectionKeys.length - 1}
          className="nav-button"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default JsonViewer;
