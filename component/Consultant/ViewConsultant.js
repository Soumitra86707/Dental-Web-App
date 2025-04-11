import { useState, useEffect } from "react";
import { db, storage } from "../Config/FirebaseConfig";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { FaEdit, FaTrash } from "react-icons/fa";
import "../../vendors/styles/core.css";
import "../../vendors/styles/icon-font.min.css";
import "../../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../../plugins/datatables/css/responsive.bootstrap4.min.css";
import "../../vendors/styles/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";

function ViewConsultant() {
  const [consultants, setConsultants] = useState([]);
  const [visiblePatients, setVisiblePatients] = useState({}); // Track which consultant's patients are visible
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
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
  const handleDelete = async (id, photoURL) => {
    try {
      // Delete consultant from Firestore first
      await deleteDoc(doc(db, "consultants", id));
  
      // Remove consultant from UI immediately
      setConsultants((prev) => prev.filter((consultant) => consultant.id !== id));
  
      // Delay image deletion by 2 seconds (2000ms)
      if (photoURL) {
        setTimeout(async () => {
          try {
            const photoRef = ref(storage, photoURL);
            await deleteObject(photoRef);
            
          } catch (error) {
            console.error("Error deleting image:", error);
          }
        }, 2000); // 2-second delay
      }
    } catch (error) {
      console.error("Error deleting consultant:", error);
    }
  };
  const editConsultant = async (id) => {
    
    navigate(`/Consultant/AddConsultant/${id}`);
}; 
const filteredConsultants = consultants.filter((consultant) =>
  consultant.fname.toLowerCase().includes(searchQuery.toLowerCase()) ||
  consultant.lname.toLowerCase().includes(searchQuery.toLowerCase()) ||
  consultant.specialty.toLowerCase().includes(searchQuery.toLowerCase())
);
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
                <div style={{ textAlign: "left", fontSize: "25px", fontWeight: "bold" }}>Consultant Overview</div>
                                        
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
            <input type="text" placeholder="Search by Consultant Name "  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "5px", outline: "none", flexGrow: 1, marginRight: "10px", }} />

            
          </div>
        </div>

          <div className="row pb-10">
          {filteredConsultants.length > 0 ? (
            filteredConsultants.map((consultant) => (
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
                      <div className="text-center mb-3" style={{marginTop:"15px"}}>
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
                        <div className="font-14 text-secondary weight-500">Additional Information: {consultant.AdditionalInformation}</div>

                    </div>

                      <div className="d-flex justify-content-between mt-3" style={{ margin: "5px 15px" }}>
                        <button className="btn btn-sm btn-primary" onClick={() => editConsultant(consultant.id)}>
                          <FaEdit /> Edit
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={() => handleViewPatients(consultant.id)}>
                          <FaEdit /> View Patients
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(consultant.id, consultant.photoURL)}>
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              ))
            ) : (
              <p>No Consultant Profile Found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewConsultant;
