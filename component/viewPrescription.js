import { useEffect, useState } from "react";
import "../vendors/styles/core.css";
import "../vendors/styles/icon-font.min.css";
import "../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../plugins/datatables/css/responsive.bootstrap4.min.css";
import "../vendors/styles/style.css";
import $ from "jquery";
import "bootstrap/dist/css/bootstrap.min.css";
import "./loading.css";
import { db } from "./Config/FirebaseConfig"; // Ensure firebase is configured properly
import { collection, getDocs } from "firebase/firestore";
import {   FaFileWord, FaFilePdf, FaFileExcel } from "react-icons/fa";
import { FaRegHeart, FaRegCalendarAlt } from "react-icons/fa";
import React from "react";
import Chart from "react-apexcharts";
import DataTable from "react-data-table-component";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

function ViewPrescription() {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <div className="App">
            <div className="main-container">
                <div className="xs-pd-20-10 pd-ltr-20">
                <div className="card-box mb-30">
						<div className="pd-20">
							<h4 className="text-blue h4">Prescription History</h4>
							
						</div>
						<div className="pb-20">
							<table className="data-table table stripe hover nowrap table-striped">
								<thead>
									<tr>
										<th className="table-plus ">Name</th>
										<th>Age</th>
										<th>Office</th>
										<th>Address</th>
										<th>Start Date</th>
										<th >Action</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td className="table-plus">Gloria F. Mead</td>
										<td>25</td>
										<td>Sagittarius</td>
										<td>2829 Trainer Avenue Peoria, IL 61602</td>
										<td>29-03-2018</td>
										<td>
                                            <div className="dropdown">
                                                <button
                                                    className="btn btn-link font-24 p-0 line-height-1 no-arrow dropdown-toggle"
                                                    type="button"
                                                    onClick={() => setIsOpen(!isOpen)}
                                                >
                                                    <i className="dw dw-more"></i>
                                                </button>
                                                <ul className={`dropdown-menu dropdown-menu-end dropdown-menu-icon-list ${isOpen ? "show" : ""}`}>
                                                    <li>
                                                    <a className="dropdown-item" href="#">
                                                        <i className="dw dw-eye"></i> View
                                                    </a>
                                                    </li>
                                                    <li>
                                                    <a className="dropdown-item" href="#">
                                                        <i className="dw dw-edit2"></i> Edit
                                                    </a>
                                                    </li>
                                                    <li>
                                                    <a className="dropdown-item" href="#">
                                                        <i className="dw dw-delete-3"></i> Delete
                                                    </a>
                                                    </li>
                                                </ul>
                                            </div>
										</td>
									</tr>
									
                                </tbody>
							</table>
						</div>
					</div>
                </div>
            </div>
        </div>
    );
}

export default ViewPrescription;
