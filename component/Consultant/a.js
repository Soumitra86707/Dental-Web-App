import { useState, useEffect } from "react";
import { db } from "../Config/FirebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

function ViewAppointment() {
  const [consultants, setConsultants] = useState([]);
  const [visiblePatients, setVisiblePatients] = useState({}); // Track which consultant's patients are visible

  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        const consultantsCollection = collection(db, "consultants");
        const consultantsSnapshot = await getDocs(consultantsCollection);
        const consultantsList = consultantsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setConsultants(consultantsList);
      } catch (error) {
        console.error("Error fetching consultants:", error);
      }
    };

    fetchConsultants();
  }, []);

  // Mock function to load patients (Replace this with Firebase query)
  const handleViewPatients = (consultantId) => {
    const demoPatients = [
      { id: 1, name: "John Doe" },
      { id: 2, name: "Jane Smith" },
      { id: 3, name: "Alice Johnson" },
    ];
    setVisiblePatients((prev) => ({
      ...prev,
      [consultantId]: demoPatients, // Show patients only for clicked consultant
    }));
  };

  const handleClosePatients = (consultantId) => {
    setVisiblePatients((prev) => ({
      ...prev,
      [consultantId]: null, // Hide patients for clicked consultant
    }));
  };

  return (
    <div className="App">
      <div className="main-container">
        <div className="xs-pd-20-10 pd-ltr-20">
          <div className="title pb-20">
            <h2 className="h3 mb-0">Dental Clinic Overview</h2>
          </div>

          <div className="row pb-10">
            {consultants.map((consultant) => (
              <div key={consultant.id} className="col-xl-3 col-lg-3 col-md-6 mb-20">
                <div className="card-box height-100-p widget-style3">
                  {visiblePatients[consultant.id] ? (
                    // If patients are visible, show the patient list
                    <div className="text-center">
                      <h4>{consultant.fname}'s Patients</h4>
                      <ul className="list-group">
                        {visiblePatients[consultant.id].map((patient) => (
                          <li key={patient.id} className="list-group-item d-flex justify-content-between">
                            {patient.name}
                            <FaTimes style={{ cursor: "pointer", color: "red" }} />
                          </li>
                        ))}
                      </ul>
                      <button className="btn btn-secondary mt-3" onClick={() => handleClosePatients(consultant.id)}>
                        Close
                      </button>
                    </div>
                  ) : (
                    // Otherwise, show consultant details
                    <>
                      <div className="text-center mb-3">
                        <img
                          src={consultant.photoURL || "default-profile.jpg"}
                          alt={`${consultant.fname} ${consultant.lname}`}
                          className="consultant-profile-pic"
                        />
                      </div>

                      <div className="widget-data">
                        <div className="weight-700 font-18 text-dark">{consultant.fname + " " + consultant.lname}</div>
                        <div className="font-14 text-secondary weight-500">Mobile No: {consultant.phone}</div>
                        <div className="font-14 text-secondary weight-500">Email: {consultant.email}</div>
                        <div className="font-14 text-secondary weight-500">Specialty: {consultant.specialty}</div>
                        <div className="font-14 text-secondary weight-500">Experience: {consultant.experience.years + " Year " + consultant.experience.months + " Months"}</div>
                        <div className="font-14 text-secondary weight-500">Available Day: {consultant.availability.join(", ")}</div>
                    </div>

                      <div className="d-flex justify-content-between mt-3" style={{ margin: "5px 15px" }}>
                        <button className="btn btn-sm btn-primary">
                          <FaEdit /> Edit
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={() => handleViewPatients(consultant.id)}>
                          <FaEdit /> View Patients
                        </button>
                        <button className="btn btn-sm btn-danger">
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </>
                  )}
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
