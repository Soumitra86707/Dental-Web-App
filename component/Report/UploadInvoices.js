import React, { useState, useEffect } from "react";
import { db } from "../Config/FirebaseConfig"; // Import Firebase config
import { collection, query, where, getDocs } from "firebase/firestore";

const PatientForm = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [customPatientName, setCustomPatientName] = useState("");
  const [selectedLab, setSelectedLab] = useState("");
  const [customLabName, setCustomLabName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [invoiceFile, setInvoiceFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setInvoiceFile(file);
    
        if (file) {
          const fileUrl = URL.createObjectURL(file);
          setFilePreview(fileUrl);
        }
      };
  return (
    <div className="App">
      <div className="main-container" >
        <div className="card-box xs-pd-20-10 pd-ltr-20">
          <form>
            <h3>Personal Details</h3>
            <div className="row">
              {/* Lab Name Dropdown */}
              <div className="col-md-6 col-sm-12">
                <div className="form-group">
                  <label>Lab Name</label>
                  <select
                    className="form-control"
                    value={selectedLab}
                    onChange={(e) => {
                      setSelectedLab(e.target.value);
                      if (e.target.value !== "Other") {
                        setCustomLabName("");
                      }
                    }}
                  >
                    <option value="">Select Lab</option>
                    <option value="Lab A">Lab A</option>
                    <option value="Lab B">Lab B</option>
                    <option value="Lab C">Lab C</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Custom Lab Name (Appears when "Other" is selected) */}
              {selectedLab === "Other" && (
                <div className="col-md-6 col-sm-12">
                  <div className="form-group">
                    <label>Custom Lab Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={customLabName}
                      onChange={(e) => setCustomLabName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Patient Name Dropdown */}
              
              {/* Custom Patient Name (Appears when "Other" is selected) */}
              
            </div>

            {/* Total Amount & Paid Amount Row */}
            <div className="row">
              <div className="col-md-6 col-sm-12">
                <div className="form-group">
                  <label>Total Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-6 col-sm-12">
                <div className="form-group">
                  <label>Paid Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Issue Date & Upload Invoice */}
            <div className="row">
              <div className="col-md-6 col-sm-12">
                <div className="form-group">
                  <label>Issue Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-6 col-sm-12">
                <div className="form-group">
                  <label>Upload Invoice (PDF/JPG)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf, .jpg, .jpeg, .png"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>

            {/* File Preview Section */}
            {filePreview && (
              <div className="row">
                <div className="col-md-6 col-sm-12">
                  <div className="form-group">
                    <label>File Preview</label>
                    {invoiceFile?.type === "application/pdf" ? (
                      <iframe
                        src={filePreview}
                        width="100%"
                        height="400px"
                        title="PDF Preview"
                      ></iframe>
                    ) : (
                      <img
                        src={filePreview}
                        alt="Uploaded"
                        style={{ width: "100%", maxHeight: "400px" }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="row">
              <div className="col-md-12 text-center">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => alert("Form Submitted")}
                >
                  Submit
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientForm;
