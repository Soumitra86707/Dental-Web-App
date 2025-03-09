import { useState } from "react";
import "../../vendors/styles/core.css";
import "../../vendors/styles/icon-font.min.css";
import "../../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../../plugins/datatables/css/responsive.bootstrap4.min.css";
import "../../vendors/styles/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaRegHeart } from "react-icons/fa";
import React from "react";

function ViewAppointment() {
  // Array of patient details
  const patients = [
    { id: 1, name: "John Doe", age: 30, complaint: "Toothache", slot: "10:00 AM" },
    { id: 2, name: "Jane Smith", age: 25, complaint: "Cavity", slot: "11:00 AM" },
    { id: 3, name: "Emily Johnson", age: 40, complaint: "Gum Pain", slot: "12:00 PM" },
    { id: 4, name: "Michael Brown", age: 35, complaint: "Root Canal", slot: "02:00 PM" },
    { id: 5, name: "Sarah Wilson", age: 28, complaint: "Braces Adjustment", slot: "03:00 PM" },
  ];

  return (
    <div className="App">
      <div className="main-container">
        <div className="xs-pd-20-10 pd-ltr-20">
          <div className="title pb-20">
            <h2 className="h3 mb-0">Dental Clinic Overview</h2>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                padding: "10px",
              }}
            >
                <div style={{ textAlign: "left", fontSize: "18px", fontWeight: "bold" }}></div>
                    <div className="filter-container">
                        <input
                        type="text"
                        placeholder="Search"
                        style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "5px", outline: "none", width: "150px" }}
                        />
                        <input
                        type="date"
                        style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "5px", outline: "none", flexGrow: 1 }}
                        />
                        <select
                        style={{ padding: "5px 10px", border: "1px solid #ccc", borderRadius: "5px", backgroundColor: "#fff", color: "#333", cursor: "pointer", outline: "none" }}
                        >
                        <option value="1-day">1 Day</option>
                        <option value="1-week">1 Week</option>
                        <option value="1-month">1 Month</option>
                        <option value="6-months">6 Months</option>
                        <option value="1-year">1 Year</option>
                        </select>
                    </div>
                </div>

          </div>

          <div className="row pb-10">
            {patients.map((patient) => (
              <div key={patient.id} className="col-xl-3 col-lg-3 col-md-6 mb-20">
                <div className="card-box height-100-p widget-style3">
                  <div className="d-flex flex-wrap">
                    <div className="widget-data">
                      <div className="weight-700 font-18 text-dark">{patient.name}</div>
                      <div className="font-14 text-secondary weight-500">Age: {patient.age}</div>
                      <div className="font-14 text-secondary weight-500">Complaint: {patient.complaint}</div>
                      <div className="font-14 text-secondary weight-500">Slot: {patient.slot}</div>
                    </div>
                    
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewAppointment;