import { useEffect,useState,useRef  } from "react";
import "../vendors/styles/core.css";
import "../vendors/styles/icon-font.min.css";
import "../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../plugins/datatables/css/responsive.bootstrap4.min.css";
import "../vendors/styles/style.css";
import $ from "jquery";
import { Link, Outlet } from "react-router-dom";
import "./topbar.css"
import myIcon from "../d2.ico";
import { doc,getDoc} from "firebase/firestore";
import { db } from "./Config/FirebaseConfig"; 
import {useNavigate} from 'react-router-dom';


function Topbar({ onLogout }) {
     /* const [isOpen, setIsOpen] = useState(false);  */
    const [isOpenProfile, setIsOpenProfile] = useState(false);
    const [openReport, setOpenReport] = useState(false);
    const [billingManagement, setBillingManagement] = useState(false);
    const [openAppointment, setOpenAppointment] = useState(false);
    const [openConsultant, setOpenConsultant] = useState(false);
    const [openDiary, setOpenDiary] = useState(false);
    const [doctorNane, setDoctorName] = useState("");
    const [oldImageUrl, setOldImageUrl] = useState("");
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            /* setIsOpen(false); */
          }
        };
    
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, []);
      useEffect(() => {
        // Toggle Sidebar
        $(".menu-icon, [data-toggle='left-sidebar-close']").on("click", function () {
          $("body").toggleClass("sidebar-shrink");
          $(".left-side-bar").toggleClass("open");
          $(".mobile-menu-overlay").toggleClass("show");
        });
    
        // Toggle Header Search
        $("[data-toggle='header_search']").on("click", function () {
          $(".header-search").slideToggle();
        });
    
        // Close Sidebar on Outside Click
        $(document).on("touchstart click", function (e) {
          if (
            $(e.target).parents(".left-side-bar").length === 0 &&
            !$(e.target).is(".menu-icon, .menu-icon img")
          ) {
            $(".left-side-bar").removeClass("open");
            $(".menu-icon").removeClass("open");
            $(".mobile-menu-overlay").removeClass("show");
          }
        });
    
        // **Close Sidebar on Link Click in Mobile or Tablet**
        $(".left-side-bar a").on("click", function () {
          if (window.innerWidth <= 1024) {
            $(".left-side-bar").removeClass("open");
            $(".menu-icon").removeClass("open");
            $(".mobile-menu-overlay").removeClass("show");
          }
        });
    
        // Cleanup Event Listeners
        return () => {
          $(".menu-icon, [data-toggle='left-sidebar-close']").off("click");
          $("[data-toggle='header_search']").off("click");
          $(document).off("touchstart click");
          $(".left-side-bar a").off("click");
        };
      }, []);

    useEffect(() => {
        const fetchProfileData = async () => {
          try {
            const userId = "1234"; // Replace with the actual logged-in user ID
            const docRef = doc(db, "profile", userId); // Fetch from 'profiles' collection
            const docSnap = await getDoc(docRef);
    
            if (docSnap.exists()) {

              setDoctorName(docSnap.data().fullName || "");
              setOldImageUrl(docSnap.data().profilePicture || "");
              
            } else {
              console.log("No profile found!");
            }
          } catch (error) {
            console.error("Error fetching profile data:", error);
          }
        };
    
        fetchProfileData();
      }, []);


      const handleLogout = () => {
        // Clear any stored authentication details (optional)
        // Example: localStorage.removeItem('authToken');
        
        onLogout(); // Call the logout function passed from App
        navigate('/'); // Redirect to the landing page
      };

return (
    <div className="App" >
        <div className="header">
            <div className="header-left">
                <div className="menu-icon bi bi-list"></div>
                {/* <div
                    className="search-toggle-icon bi bi-search"
                    data-toggle="header_search"
                ></div> */}
                <div className="header-search">
                    <span style={{fontSize:"25px",fontWeight:"bold",color:"#34949C"}}>Dr. Nithya's Dental & Smile Design Clinic</span>
                    {/* <form>
                        <div className="form-group mb-0">
                            <i className="dw dw-search2 search-icon"></i>
                            <input
                                type="text"
                                className="form-control search-input"
                                placeholder="Search Here"
                            />
                            
                        </div>
                    </form> */}
                </div>
            </div>
            <div className="header-right" style={{ paddingRight: "40px" }}>
                 <div className="user-notification" ref={dropdownRef}>
                    <div className="dropdown">
                        {/* <a
                        className="dropdown-toggle no-arrow"
                        href="#"
                        role="button"
                        onClick={() => setIsOpen(!isOpen)}
                        >
                        <i className="icon-copy dw dw-notification"></i>
                        <span className="badge notification-active"></span>
                        </a>
 */}
                        {/* <div className={`dropdown-menu dropdown-menu-right ${isOpen ? "show" : ""}`}>
                            <div className="notification-list mx-h-350 customscroll">
                                <ul>
                                    <li>
                                        <p>FollowUp Date ,PatientsName, Patients PhoneNumber</p>
                                    </li>
                                </ul>
                            </div>
                        </div> */}
                    </div>
                </div> 
                <div className="user-info-dropdown" onClick={() => setIsOpenProfile(!isOpenProfile)}>
                        <div className="dropdown">
                            <a className="dropdown-toggle" role="button">
                            <span className="user-icon" >
                                <img src={oldImageUrl} alt="myIcon" style={{height:"50px", width:"50px"}} />
                            </span>
                            <span className="user-name"style={{ paddingLeft: "10px" ,fontSize:"20px",fontWeight:"bold" , color:"#34949C"}}  >{doctorNane}</span>
                            </a>

                            <div
                            className={`dropdown-menu dropdown-menu-right dropdown-menu-icon-list ${isOpenProfile ? "show" : ""}`}
                            >
                                <Link to="/Profile" className="dropdown-item text-decoration-none no-arrow">
                            
                                <i className="dw dw-user1"></i> Profile
                            </Link>
                            
                            <a className="dropdown-item" onClick={handleLogout} style={{cursor:"pointer"}}>
                                <i className="dw dw-logout"></i> Log Out
                            </a>
                            </div>
                        </div>
                </div>
                {/* <div className="github-link">
                    <a href="#" target="_blank" ><img src="../vendors/images/github.svg" alt="" /></a>
                </div> */}
            </div>
        </div>
        <div className="left-side-bar">
            <div className="brand-logo">
                <a >
                    <img src={myIcon} alt="myIcon" style={{ marginTop:"120px",marginLeft:"30px",width: "170px", height: "130px", borderRadius:30 }} />

                    {/* <img
                        src="d2.jpg"
                        alt=""
                        className="light-logo"
                    /> */}
                </a>
                <div className="close-sidebar" data-toggle="left-sidebar-close">
                    <i className="ion-close-round"></i>
                </div>
            </div>
            <div className="menu-block customscroll">
                <div className="sidebar-menu">
                    <ul id="accordion-menu" style={{paddingTop:"180px"}}>
                        <li className="dropdown">
                            <Link to="/Dashboard" className="dropdown-toggle text-decoration-none no-arrow">
                                <span className="micon bi bi-house"></span>
                                <span className="mtext">Home</span>
                            </Link>

                        </li>
                        <li className={`dropdown ${openAppointment ? "show" : ""} hover-primary`} >
                            <button
                            className="dropdown-toggle no-arrow"
                            onClick={() => setOpenAppointment(!openAppointment)}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "white",
                                fontSize: "15px",
                                display: "flex",
                                alignItems: "center",
                                gap: "40px",
                                  // Adds space between text and arrow
                            }}
                            >
                                <span className="micon fa fa-calendar" aria-hidden="true"></span>

                            <span className="mtext">Appointment Management</span>
                            {/* <span style={{ transition: "transform 0.3s", transform: openAppointment ? "rotate(180deg)" : "rotate(0deg)" }}>
                                🔽
                            </span> */}
                            </button>
                            <ul
                            className={`submenu ${openAppointment ? "show" : ""}`}
                            style={{ display: openAppointment ? "block" : "none" }}
                            >
                            <li><Link to="/appointments/ViewAppointment" className="dropdown-toggle text-decoration-none no-arrow">View Appointment</Link></li>
                            <li><Link to="/appointments/BookAppointment" className="dropdown-toggle text-decoration-none no-arrow">Book Appointment</Link></li>
                            <li><Link to="/appointments/RescheduleAppointment" className="dropdown-toggle text-decoration-none no-arrow">Reschedule Appointment</Link></li>
                            <li><Link to="/appointments/CancelAppointment" className="dropdown-toggle text-decoration-none no-arrow">Cancel Appointment</Link></li>
                            </ul>
                        </li>

                        <li className={`dropdown ${openConsultant ? "show" : ""} hover-primary`}>
                        <button
                            className="dropdown-toggle no-arrow"
                            onClick={() => setOpenConsultant(!openConsultant)}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "white",
                                fontSize: "inherit",
                                display: "flex",
                                alignItems: "center",
                                gap: "50px",  
                            }}
                            >
                                <span className="micon bi bi-person-badge" aria-hidden="true"></span>
                            <span className="mtext">Consultant Management</span>
                            
                            </button>
                            <ul
                            className={`submenu ${openConsultant ? "show" : ""}`}
                            style={{ display: openConsultant ? "block" : "none" }}
                            >
                                <li><Link to="/Consultant/View" className="dropdown-toggle text-decoration-none no-arrow">View </Link></li>
                                <li><Link to="/Consultant/AddConsultant" className="dropdown-toggle text-decoration-none no-arrow">Add</Link></li>
                                <li><Link to="/Consultant/BookAppointment" className="dropdown-toggle text-decoration-none no-arrow">Book</Link></li>
                                <li><Link to="/Consultant/RescheduleAppointment" className="dropdown-toggle text-decoration-none no-arrow">Reschedule</Link></li>
                                <li><Link to="/Consultant/CancelAppointment" className="dropdown-toggle text-decoration-none no-arrow">Cancel</Link></li> 
                                <li><Link to="/Consultant/PaymentHistory" className="dropdown-toggle text-decoration-none no-arrow">Payment History</Link></li>
                                
                            </ul>
                        </li>
                        <li className={`dropdown ${openReport ? "show" : ""} hover-primary`}>
                        <button
                            className="dropdown-toggle no-arrow"
                            onClick={() => setOpenReport(!openReport)}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "white",
                                fontSize: "inherit",
                                display: "flex",
                                alignItems: "center",
                                gap: "40px", 
                            }}
                            >
                                <span className="micon bi bi-file-earmark-medical" aria-hidden="true"></span>
                                <span className="mtext">Report Management</span>
                            
                            </button>
                            <ul
                            className={`submenu ${openReport ? "show" : ""}`}
                            style={{ display: openReport ? "block" : "none" }}
                            >
                                <li><Link to="/Report/viewReports" className="dropdown-toggle text-decoration-none no-arrow">View & Upload <br />Reports</Link></li>
                                
                            </ul>
                        </li>
                        <li className={`dropdown ${billingManagement ? "show" : ""} hover-primary`}>
                        <button
                            className="dropdown-toggle no-arrow"
                            onClick={() => setBillingManagement(!billingManagement)}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "white",
                                fontSize: "inherit",
                                display: "flex",
                                alignItems: "center",
                                gap: "40px", 
                            }}
                            >
                                <span className="micon bi bi-file-earmark-medical" aria-hidden="true"></span>
                                <span className="mtext">Billing Management</span>
                            
                            </button>
                            <ul
                            className={`submenu ${billingManagement ? "show" : ""}`}
                            style={{ display: billingManagement ? "block" : "none" }}
                            >
                                <li><Link to="/Report/ViewInvoices" className="dropdown-toggle text-decoration-none no-arrow">View & Upload <br /> Invoices</Link></li>
                                <li><Link to="/Report/ExtraExpenses" className="dropdown-toggle text-decoration-none no-arrow">Extra Expenses</Link></li>
                            </ul>
                        </li>
                        <li className={`dropdown ${openDiary ? "show" : ""} hover-primary`}>
                        <button
                            className="dropdown-toggle no-arrow"
                            onClick={() => setOpenDiary(!openDiary)}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "white",
                                fontSize: "inherit",
                                display: "flex",
                                alignItems: "center",
                                gap: "40px",  // Adds space between text and arrow
                            }}
                            >
                                <span className="micon bi bi-journal-bookmark" aria-hidden="true"></span>
                                <span className="mtext">Diary</span>
                            {/* <span style={{ transition: "transform 0.3s", transform: openAppointment ? "rotate(180deg)" : "rotate(0deg)" }}>
                                🔽
                            </span> */}
                            </button>
                            <ul
                            className={`submenu ${openDiary ? "show" : ""}`}
                            style={{ display: openDiary ? "block" : "none" }}
                            >
                                <li><Link to="/Diary/patientsDetails" className="dropdown-toggle text-decoration-none no-arrow">Patients Details</Link></li>
                                <li><Link to="/Diary/PaymentDetails" className="dropdown-toggle text-decoration-none no-arrow">Payments Details</Link></li>
                                
                                
                            </ul>
                        </li>
                        <li className="dropdown">
                            <Link to="/MonthlyProfit" className="dropdown-toggle text-decoration-none no-arrow">
                                <span className="micon bi bi-house"></span>
                                <span className="mtext">Monthly Earning</span>
                            </Link>

                        </li>
                        
                    </ul>
                </div>
            </div>
            <div className="copyRight">
                <div className="copyRightText">©2025 Soumitra Halder | Pondicherry University</div>
            </div>
        </div>
        <Outlet />
    </div>

  );
}

export default Topbar;
