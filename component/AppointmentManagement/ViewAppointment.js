import { useState, useEffect } from "react";
import "../../vendors/styles/core.css";
import "../../vendors/styles/icon-font.min.css";
import "../../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../../plugins/datatables/css/responsive.bootstrap4.min.css";
import "../../vendors/styles/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { db } from "../Config/FirebaseConfig";
import { collection, getDocs ,onSnapshot,query, where} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function ViewAppointment() {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA") // Ensures local date in YYYY-MM-DD format
  );
  const [filterDuration, setFilterDuration] = useState("1-day");
  const [searchQuery, setSearchQuery] = useState("");
  const [userType, setUserType] = useState("patient"); // Placeholder for dynamic user type
  const navigate = useNavigate();



  useEffect(() => {
    if (userType === "doctor") return; // Skip fetching for doctors
  
    const appointmentsRef = collection(db, "Appointments");
    const q = query(appointmentsRef, where("userType", "==", "patient"));
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAppointments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      setAppointments(fetchedAppointments);
    }, (error) => {
      console.error("Error fetching appointments:", error);
    });
  
    return () => unsubscribe(); // Clean up listener when component unmounts
  }, [userType]);
  

  function filterAppointments() {
    let filtered = [...appointments];
    const formattedSelectedDate = selectedDate.replace(/-/g, "_");

    // Show only appointments matching the selected date
    filtered = filtered.filter(appointment => appointment.appointment_date === formattedSelectedDate);

    // Sort by slot_start_time (earliest first)
    filtered.sort((a, b) => {
      const timeA = a.slot_start_time.split(":").map(Number);
      const timeB = b.slot_start_time.split(":").map(Number);
      return timeA[0] - timeB[0] || timeA[1] - timeB[1];
    });

    // Filter by search query (by patient name or reason for visit)
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (appointment) =>
          appointment.patient_name?.toLowerCase().includes(queryLower) ||
          appointment.reason_for_visit?.toLowerCase().includes(queryLower)
      );
    }

    return filtered;
  }

  const filteredAppointments = filterAppointments();
  const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, "0");
const dd = String(now.getDate()).padStart(2, "0");
const todayFormatted = `${yyyy}_${mm}_${dd}`;

  const recentTime = now.toTimeString().split(" ")[0]; // HH:MM:SS
  const handleAddPrescription = (appointmentId) => {
    
    if (!appointmentId) {
        console.error("Appointment ID is missing!");
        return;
    }
    navigate(`/addprescription/${appointmentId}`);
};
const convertTo12HourFormat = (time) => {
  let [hours, minutes] = time.split(':').map(Number);
  let ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};
  return (
    <div className="App">
      <div className="main-container">
        <div className="xs-pd-20-10 pd-ltr-20">
        <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  padding: "10px",
                }}
              >
                <div style={{ textAlign: "left", fontSize: "25px", fontWeight: "bold" }}>Appointment Overview</div>
                                        
                            </div>
                                    <div
                                style={{
                                display: "flex",
                                justifyContent: "flex-end", // Aligns content to the right
                                width: "100%",
                                padding: "10px",
                                }}
                            >
                            
          <div className="filter-container">
            <input type="text" placeholder="Search by Name or Reason" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "5px", outline: "none", flexGrow: 1, marginRight: "10px", }} />

            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "5px", outline: "none", flexGrow: 1, marginRight: "10px", }} />

          </div>
        </div>

          <div className="row pb-10">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                
                <div key={appointment.id} className="col-xl-3 col-lg-3 col-md-6 mb-20">
                  <div className="View-appointment-div-heading"> {convertTo12HourFormat(appointment.slot_start_time)}</div>
                  <div className="card-box height-100-p widget-style3">
                    <div className="widget-data">
                      <div className="weight-700 font-18 text-dark">{appointment.patient_name}</div>
                      <div className="font-14 text-secondary">Age: {appointment.age}</div>
                      <div className="font-14 text-secondary">Complaint: {appointment.reason_for_visit}</div>
                      <div className="font-14 text-secondary">Date: {appointment.appointment_date.replace(/_/g, "-")}</div>
                      <div className="font-14 text-secondary">
                        Slot: {convertTo12HourFormat(appointment.slot_start_time)} - {convertTo12HourFormat(appointment.slot_end_time)}
                      </div>
                      {/* <button
                            className="btn btn-primary mt-2"
                            onClick={() => handleAddPrescription(appointment.id)}
                          >
                            Add Prescription
                          </button> */}
                     
                      {/* {appointment.appointment_date === todayFormatted &&
                        recentTime >= appointment.slot_start_time &&
                        recentTime <= appointment.slot_end_time && (
                          <button
                            className="btn btn-primary mt-2"
                            onClick={() => handleAddPrescription(appointment.id)}
                          >
                            Add Prescription
                          </button>
                        )} */}
{/*                         {appointment.appointment_date === todayFormatted &&
                        recentTime >= appointment.slot_start_time &&
                        recentTime <= appointment.slot_end_time && (
                          <button
                            className="btn btn-primary mt-2"
                            onClick={() => handleAddPrescription(appointment.id)}
                          >
                            Add Prescription
                          </button>
                        )} */}
                        {appointment.appointment_date === todayFormatted &&(
                        
                          <button
                            className="btn btn-primary mt-2"
                            onClick={() => handleAddPrescription(appointment.id)}
                          >
                            Add Prescription
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No Appointments Found</p>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewAppointment;
