import { useState, useEffect } from "react";
import { db, storage } from "../Config/FirebaseConfig";
import { collection, getDocs, doc, deleteDoc ,query,where } from "firebase/firestore";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [modalConsultantName, setModalConsultantName] = useState("");
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

  const handleViewPatients = async (consultantId, consultantName) => {
    try {
      const q = query(
        collection(db, "Consultantappointments"),
        where("consultantId", "==", consultantId)
      );
  
      const querySnapshot = await getDocs(q);
  
      const patients = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().patientName || "Unnamed Patient", // Adjust field if needed
        reason: doc.data().reason || "Unnamed Reason",
        PrescriptionDate: doc.data().prescriptionDate || "none",
        prescriptionId: doc.data().prescriptionId || "none",

      }));
  
      setSelectedPatients(patients);
      setModalConsultantName(consultantName);
      setShowPatientModal(true);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const handleCloseModal = () => {
    setShowPatientModal(false);
    setSelectedPatients([]);
  };

  const handleDelete = async (id, photoURL) => {
    try {
      await deleteDoc(doc(db, "consultants", id));
      setConsultants((prev) => prev.filter((consultant) => consultant.id !== id));

      if (photoURL) {
        setTimeout(async () => {
          try {
            const photoRef = ref(storage, photoURL);
            await deleteObject(photoRef);
          } catch (error) {
            console.error("Error deleting image:", error);
          }
        }, 2000);
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
              justifyContent: "flex-end",
              width: "100%",
              padding: "10px",
            }}
          >
            <div className="filter-container">
              <input
                type="text"
                placeholder="Search by Consultant Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "5px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  outline: "none",
                  flexGrow: 1,
                  marginRight: "10px",
                }}
              />
            </div>
          </div>

          <div className="row pb-10">
            {filteredConsultants.length > 0 ? (
              filteredConsultants.map((consultant) => (
                <div key={consultant.id} className="col-xl-3 col-lg-3 col-md-6 mb-20">
                  <div className="card-box height-100-p widget-style3">
                    <div className="text-center mb-3" style={{ marginTop: "15px" }}>
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
                      <div className="font-14 text-secondary weight-500">
                        Experience: {consultant.experience.years + " Year " + consultant.experience.months + " Months"}
                      </div>
                      <div className="font-14 text-secondary weight-500">
                        Available Day: {consultant.availability.join(", ")}
                      </div>
                      <div className="font-14 text-secondary weight-500">
                        Additional Information: {consultant.AdditionalInformation}
                      </div>
                    </div>

                    <div className="d-flex justify-content-between mt-3" style={{ margin: "5px 15px" }}>
                      <button className="btn btn-sm btn-primary" onClick={() => editConsultant(consultant.id)}>
                        <FaEdit /> Edit
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleViewPatients(consultant.id, consultant.fname)}
                      >
                        <FaEdit /> View Patients
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(consultant.id, consultant.photoURL)}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No Consultant Profile Found</p>
            )}
          </div>
        </div>
      </div>

      {/* === Patient Modal Popup === */}
      {showPatientModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              marginTop:"50px",
              borderRadius: "10px",
              maxWidth: "700px",
              maxHeight: "80vh",
              overflowY: "auto",
              textAlign: "center",
              boxShadow: "0 0 10px rgba(0,0,0,0.25)",
            }}
          >
            <h4>{modalConsultantName}'s Patients</h4>
            <table className="data-table table nowrap table-striped ">
                <thead>
                    <tr>
                        
                        <th>Name</th>
                        <th>Reason</th>
                        
                        <th>Prescription Date</th>
                        
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {selectedPatients.length === 0 ? (
                        <tr>
                            <td colSpan="7" style={{ textAlign: "center" }}>No data found</td>
                        </tr>
                    ) : (
                      selectedPatients.map((row, index) => (
                            <tr key={index}>
                                <td>{row.name}</td>
                                
                                <td>{row.reason}</td>
                                <td>{row.PrescribDate || " --- "}</td>
                                
                                <td>
                                    <div className="dropdown" style={{ marginRight: "20px" ,cursor:"pointer" }}>

                                                <a
                                                    className="dropdown-item"
                                                    onClick={() => navigate(`/Prescription/Download/${row.prescriptionId}`)} 
                                                >
                                                    <i className="dw dw-eye" style={{fontSize:"18px",fontWeight:"bold"}}></i>
                                                </a>
                                            
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            
            <button className="btn btn-secondary" onClick={handleCloseModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewConsultant;
