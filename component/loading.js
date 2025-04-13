import { useEffect , useState } from "react";
import "../vendors/styles/core.css";
import "../vendors/styles/icon-font.min.css";
import "../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../plugins/datatables/css/responsive.bootstrap4.min.css";
 import "../vendors/styles/style.css"; 
import $ from "jquery";
import "bootstrap/dist/css/bootstrap.min.css";
import "./loading.css";
import moment from "moment"; 
import { FaRegHeart,FaRegCalendarAlt  } from "react-icons/fa";
import React from "react";
import Chart from "react-apexcharts";
import DataTable from "react-data-table-component";
import useFetchAppointments from "./js/appointment";
import useFetchWeeklyAppointments from "./js/weekly";
import useFetchWeeklyTreatmentDone from "./js/weeklyTreatmentDone"; 
import useFetchGrowthData from "./js/MonthlyPrecentage";
import useFetchPatientGrowth from "./js/MonthlyTreatmentGrowth";
import useFetchPatientAndTreatmentData from "./js/TotalPatientsCount";
import { db } from "./Config/FirebaseConfig"; // Import Firestore database instance
import { collection, query, where, getDocs,orderBy, limit } from "firebase/firestore";
import { Link, Outlet } from "react-router-dom";
import { fetchTotalEarnings } from "./Function/fetchEarnings";
import { useNavigate } from "react-router-dom";
import  { fetchEarningsData } from "./Function/fetchingDataForEarning";
import EarningsChart from "./Function/EarningsChart";
import PatientsChart from "./Function/Patients/PatientsChart"; // Adjust import path if needed
import { fetchPatientsData } from "./Function/Patients/FetchPatientDataForGraph"; // Adjust import path
import RadialBarChart from "./Function/RadialChart";

function Loading() {
	const { today, total } = useFetchAppointments();
	const { growthPercentage} = useFetchGrowthData();
	const { growthRate } = useFetchPatientGrowth();
	const { totalPatients, totalTreatments ,totalconsultants} = useFetchPatientAndTreatmentData();
	const [viewMode, setViewMode] = useState("yearly"); // "monthly" or "daily"
	const [totalEarnings, setTotalEarnings] = useState(0);
	const [chartData, setChartData] = useState({ data: [], categories: [] });
	const [patientsViewMode, setPatientsViewMode] = useState("daily");
	const [patientsData, setPatientsData] = useState({});
	const [categories, setCategories] = useState([]);
	const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(false);
	const [openDropdown, setOpenDropdown] = useState(null);
  const navigate = useNavigate();
	useEffect(() => {
		const loadPatientsData = async () => {
		  if (!doctorId) return; // Ensure doctorId is available
		  const fetchedData = await fetchPatientsData(patientsViewMode);
		  setPatientsData((prevData) => ({
			...prevData,
			[patientsViewMode]: fetchedData,
		  }));
		};
		
		loadPatientsData();
	  }, [patientsViewMode]);
  
/* 	const handleChange = (e) => {
	  setViewMode(e.target.value);
	}; */
/*   
	const lineChartOptionsViewMode = {
	  series: [{ name: "Prescriptions", data: chartData }],
	  chart: {
		height: 300,
		type: "line",
		zoom: { enabled: false },
		dropShadow: { enabled: true, color: "#000", top: 18, left: 7, blur: 16, opacity: 0.2 },
		toolbar: { show: false },
	  },
	  colors: ["#f0746c"],
	  stroke: { width: [3], curve: "smooth" },
	  xaxis: { categories },
	  legend: { position: "top", horizontalAlign: "right" },
	}; */
/* 	useEffect(() => {
		document.querySelectorAll("[data-bgcolor]").forEach((element) => {
		  element.style.backgroundColor = element.getAttribute("data-bgcolor");
		});
	  }, []); */



	  
	  // Weekly Bar Chart
	  const weeklyData = useFetchWeeklyAppointments();

	  // Define chart options dynamically
	  const weeklyBarChartOptions = {
		series: [{ name: "Week", data: weeklyData }],
		chart: {
		  height: 70,
		  type: "bar",
		  toolbar: { show: false },
		  sparkline: { enabled: true },
		},
		plotOptions: {
		  bar: {
			columnWidth: "5px",
			distributed: true,
			borderRadius: 2,
			borderRadiusApplication: "end", // Apply border-radius only at the end
			endingShape: "rounded",
		  },
		},
		dataLabels: { enabled: false },
		xaxis: { labels: { show: false } },
	  };
	// Weekly Bar Chart
	const weeklyTreatmentData = useFetchWeeklyTreatmentDone();

	// Define chart options dynamically
	const surgeryChartOptions = {
	  series: [{ name: "Week", data: weeklyTreatmentData }],
	  chart: {
		height: 70,
		type: "bar",
		toolbar: { show: false },
		sparkline: { enabled: true },
	  },
	  plotOptions: {
		bar: {
		  columnWidth: "5px",
		  distributed: true,
		  borderRadius: 2,
		  borderRadiusApplication: "end", // Apply border-radius only at the end
		  endingShape: "rounded",
		},
	  },
	  dataLabels: { enabled: false },
	  xaxis: { labels: { show: false } },
	};





/*  */
  const doctorId = "Dr. Nithya";
  const [earningsViewMode, setEarningsViewMode] = useState("sixMonths");
  const [earningsData, setEarningsData] = useState({
    sixMonths: { data: [], categories: [] },
    oneYear: { data: [], categories: [] },
    twoYears: { data: [], categories: [] },
  });

  useEffect(() => {
			/* For fetching the total amount */
	 		 getEarnings();


	  /* Fetch Earning Graph data */
	  fetchData();
	  /* fetch all for patiennts graph */
	  fetchLatestPrescriptions();
/* DIv Colour  */
	document.querySelectorAll("[data-bgcolor]").forEach((element) => {
	element.style.backgroundColor = element.getAttribute("data-bgcolor");
  });
   
  }, [earningsViewMode]);
/*   useEffect(() => {


document.querySelectorAll("[data-bgcolor]").forEach((element) => {
element.style.backgroundColor = element.getAttribute("data-bgcolor");
});

}, ); */
 
  const fetchData = async () => {
	const data = await fetchEarningsData(doctorId, earningsViewMode);
	setEarningsData((prev) => ({ ...prev, [earningsViewMode]: data }));
  };
  const getEarnings = async () => {
	const earnings = await fetchTotalEarnings(doctorId);
	setTotalEarnings(earnings);
  };


  const fetchLatestPrescriptions = async () => {
	setLoading(true);
	try {
		const prescriptionsCollection = collection(db, "prescriptions");

		// 🔹 Fetch the latest 10 prescriptions sorted by `date` (descending)
		const q = query(prescriptionsCollection, orderBy("createdAt", "desc"), limit(10));

		const prescriptionsSnapshot = await getDocs(q);
		const prescriptionsList = prescriptionsSnapshot.docs.map(doc => ({
			id: doc.id,
			...doc.data()
		}));

		setPrescriptions(prescriptionsList);
	} catch (error) {
		console.error("Error fetching prescriptions:", error);
	}
	setLoading(false);
};

const viewPrescription = (prescriptionId) => () => {
	navigate(`/Prescription/Download/${prescriptionId}`); // Change the URL as needed
};
const editPrescription = (prescriptionId) => () => {
	navigate(`/Prescription/edit/${prescriptionId}`); // Change the URL as needed
};





  return (
    <div className="App">
      
      <div className="main-container">
			<div className="xs-pd-20-10 pd-ltr-20">
				<div className="title pb-20">
					<h2 className="h3 mb-0">Dental Clinic Overview</h2>
				</div>

				<div className="row pb-10">
					<div className="col-xl-4 col-lg-3 col-md-6 mb-20">
						<Link to="/appointments/ViewAppointment" className="text-decoration-none ">
							<div className="card-box height-100-p widget-style3">
								<div className="d-flex flex-wrap">
									<div className="widget-data">
										<div className="weight-700 font-24 text-dark">{today}</div>
										<div className="font-14 text-secondary weight-500">
											Today Total Appointments
										</div>
									</div>
									<div className="widget-icon">
										<div className="icon" data-color="#00eccf" style={{ color: "#00eccf" }}>
											{/* <FaRegCalendarAlt size={24} /> */}
											<i className="icon-copy dw dw-calendar1" style={{ color: "#00eccf" }}></i> 
										</div>
									</div>
								</div>
							</div>
						</Link>
					</div>
					<div className="col-xl-4 col-lg-3 col-md-6 mb-20">
						<Link to="/Diary/patientsDetails" className="text-decoration-none ">
							<div className="card-box height-100-p widget-style3">
								<div className="d-flex flex-wrap">
									<div className="widget-data">
										<div className="weight-700 font-24 text-dark">{totalPatients}</div>
										<div className="font-14 text-secondary weight-500">
											Total Patient
										</div>
									</div>
									<div className="widget-icon">
										<div className="icon" data-color="#ff5b5b">
											<span className="icon-copy "><FaRegHeart color="#ff5b5b" size={30} /></span>
										</div>
									</div>
								</div>
							</div>
						</Link>
					</div>



					<div className="col-xl-4 col-lg-3 col-md-6 mb-20">
						<Link to="/Diary/PaymentDetails" className="text-decoration-none ">
							<div className="card-box height-100-p widget-style3">
								<div className="d-flex flex-wrap">
									<div className="widget-data">
										<div className="weight-700 font-24 text-dark">₹{totalEarnings.toLocaleString()}</div>
										<div className="font-14 text-secondary weight-500">Total Earning</div>
									</div>
									<div className="widget-icon">
										<div className="icon" data-color="#09cc06">
											<i className="icon-copy fa fa-money" aria-hidden="true" style={{ color: "#09cc06" }}></i>
										</div>
									</div>
								</div>
							</div>
						</Link>
					</div>
				</div>

				<div className="row pb-10">
					 <div className="col-md-8 mb-20">
						<div className="card-box height-100-p pd-20">
							<div className="d-flex flex-wrap justify-content-between align-items-center pb-0 pb-md-3">
							<div className="h5 mb-md-0">Clinic Activities</div>
							<div className="form-group  mb-md-0 mb-3">
								<select className="form-control form-control-sm" value={patientsViewMode} onChange={(e) => setPatientsViewMode(e.target.value)}>
								<option value="daily">Last Week</option>
								<option value="monthly">Last Month</option>
								<option value="sixMonths">Last 6 Months</option>
								<option value="yearly">Last 1 Year</option>
								</select>
							</div>
							</div>
							<PatientsChart patientsData={patientsData} patientsViewMode={patientsViewMode} />
						</div>
					</div> 
					<div className="col-md-4 mb-20">
						<div
							className="card-box min-height-200px pd-20 mb-20" data-bgcolor="#455A64" >
							<div className="d-flex justify-content-between pb-20 text-white">
								<div className="icon h1 text-white">
									<i className="fa fa-calendar" aria-hidden="true"></i>
									
								</div>
								<div className="font-14 text-right">
									<div><i className={`icon-copy ${growthPercentage < 0 ? "ion-arrow-down-c" : "ion-arrow-up-c"}`}></i> {growthPercentage.toFixed(2)}%</div>
									<div className="font-12">Since last month</div>
								</div>
							</div>
							<div className="d-flex justify-content-between align-items-end">
								<div className="text-white">
									<div className="font-14">Total Appointment</div>
									<div className="font-24 weight-500">{total}</div>
								</div>
								<div className="max-width-150">
								<Chart options={weeklyBarChartOptions} series={weeklyBarChartOptions.series} type="bar" height={70} />

									{/* <div id="appointment-chart"></div> */}
								</div>
							</div>
						</div>
						<div className="card-box min-height-200px pd-20" data-bgcolor="#265ed7">
							<div className="d-flex justify-content-between pb-20 text-white">
								<div className="icon h1 text-white">
									<i className="fa fa-stethoscope" aria-hidden="true"></i>
								</div>
								<div className="font-14 text-right">
								<div> <i className={`icon-copy ${growthRate < 0 ? "ion-arrow-down-c" : "ion-arrow-up-c"}`}></i>  {growthRate?.toFixed(2) ?? "0.00"}% </div>

									<div className="font-12">Since last month</div>
								</div>
							</div>
							<div className="d-flex justify-content-between align-items-end">
								<div className="text-white">
									<div className="font-14">Treatment Done</div>
									<div className="font-24 weight-500">{totalTreatments}</div>
								</div>
								<div className="max-width-150">
								<Chart options={surgeryChartOptions} series={surgeryChartOptions.series} type="bar" height={70}  />

								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="row pb-10">
      {/* Payment Graph (Monthly Profit & Loss) */}
					<div className="col-md-8 mb-20">
						<div className="card-box height-100-p pd-20">
							<div className="d-flex flex-wrap justify-content-between align-items-center pb-0 pb-md-3">
							<div className="h5 mb-md-0">Monthly Earnings</div>
							<div className="form-group mb-md-0 mb-3">
								<select className="form-control form-control-sm" onChange={(e) => setEarningsViewMode(e.target.value)} value={earningsViewMode}/* value={earningsViewMode} onChange={handleEarningsChange} */>
								{/* <option value="daily">Last Week</option> */}
								{/* <option value="monthly">Last Month</option> */}
								<option value="sixMonths">Last 6 Months</option>
								<option value="yearly">Last 1 Year</option>
								</select>
							</div>
							</div>
							{/* <Chart options={earningsChartOptions} series={earningsChartOptions.series} type="line" height={300} /> */}
							<EarningsChart earningsData={earningsData} earningsViewMode={earningsViewMode} />
						</div>
					</div>
					<div className="col-md-4 mb-20">
						<div className="card-box min-height-200px pd-20 mb-20"  >
						<div className="h5 mb-0">Diseases Report</div>
          
		  						<RadialBarChart />
									{/* <Chart options={chartOptions1} series={chartOptions1.series} type="radialBar" height={350} /> */}
   
						</div>
					</div>
					</div>
      {/* Radial Chart for Chef Compliments */}
{/* 	  <div className="col-lg-4 col-md-4 mb-20" style={{cursor:"pointer"}}>
      <div className="card-box height-100-p pd-20 min-height-200px">
        <div className="d-flex justify-content-between">
          <div className="h5 mb-0">Diseases Report</div>
          
        <Chart options={chartOptions1} series={chartOptions1.series} type="radialBar" height={350} />
      </div>
    </div>
				</div> */}
				<div className="card-box pb-10">
					<div className="h5 pd-20 mb-0">Recent Patient</div>
					{loading ? <p>Loading...</p> : (
					<table className="data-table table nowrap landingPage-Table">
						<thead>
							<tr>
                                    <th>Phone Number</th>
                                    <th>Name</th>
                                    <th>Disease</th>
                                    <th>Assigned Consultant</th>
                                    <th>Appointment Date</th>
                                    <th>Follow Date</th>
                                    
                                    <th>Action</th>
                                    
                            </tr>
						</thead>
						<tbody>
						{prescriptions.map((row, index) => (
                                    <tr key={index}>
                                        <td>{row.phoneNumber || "---"}</td>
                                        <td>{row.patientName || "---"}</td>
                                        <td>{row.reason_for_visit || "---"}</td>
                                        <td>{row.reason_for_visit1 || " ---"}</td>
                                        <td>{row.appointment_date || " --- "}</td>
                                        <td>{row.followUpDate ||"---"}</td>
                                        <td>    
                                            <div className="dropdown">
                                            	<button className="btn btn-link font-24 p-0 line-height-1 no-arrow dropdown-toggle text-decoration-none"
    												type="button" onClick={() => setOpenDropdown(openDropdown === index ? null : index)} >
                                                    <i className="dw dw-more"></i>
                                                </button>
                                                <ul className={`dropdown-menu dropdown-menu-end dropdown-menu-icon-list ${openDropdown === index ? "show" : ""}`}>

                                                    <li style={{cursor:"pointer"}}>
                                                    <a className="dropdown-item" onClick={viewPrescription(row.prescriptionId)} >
                                                        <i className="dw dw-eye"></i> View
                                                    </a>
                                                    </li>
                                                    <li style={{cursor:"pointer"}}>
                                                    <a className="dropdown-item" onClick={editPrescription(row.prescriptionId)}>
                                                        <i className="dw dw-edit2"></i> Edit
                                                    </a>
                                                    </li>
                                                    
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

						</tbody>
					</table>
					)}
												<div className="d-flex justify-content-end" style={{marginRight:"30px"}}>
    <Link to="/Diary/patientsDetails" className="dropdown-toggle text-decoration-none no-arrow" style={{padding:"20px 30px",backgroundColor:"#0D6EFD",borderRadius:"15px" ,color:"white",fontWeight:"bold"}}>
        More Data
    </Link>
</div>
				</div>

				
			</div>
		</div>

    </div>
  );
}

export default Loading;


