import React, { useState ,useEffect} from "react";
import { db , storage } from "../Config/FirebaseConfig"; // Firebase config
import { collection, addDoc, doc, updateDoc, getDoc, getDocs, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useParams, useNavigate } from "react-router-dom";

const PatientForm = ({ id, setIsVisible }) => { // 🔹 Accept onClose prop
  const [phoneNumber, setPhoneNumber] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [examReports, setExamReports] = useState([]);
  const [selectedExamReport, setSelectedExamReport] = useState("");

  const [reportDetails, setReportDetails] = useState("");
  const [file, setFile] = useState(null);
  const [patientId, setPatientId] = useState("");
   const [reportName, setReportName] = useState("");
const [examinationDate, setExaminationDate] = useState("");
    const [reportDate, setReportDate] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate(); 
 
  
  useEffect(() => {
    if (id) {
      const fetchPatientData = async () => {
        try {
          const patientDocRef = doc(db, "Patients Lab Reports", id);
          const patientDoc = await getDoc(patientDocRef);

          if (patientDoc.exists()) {
            const data = patientDoc.data();
            let ExamineReports = `${data.examinationDate} --- ${data.reportName}`;

            setPatientId(data.patientId);
            setPhoneNumber(data.phoneNumber || '125'); 
            setSelectedExamReport(ExamineReports);
            
            setSelectedPatient(data.patientName || 'soumitra');
            /* setPatientOptions(data.patientName); */
            setReportName(data.reportName);
            setFile(data.fileName || '');
            setReportDetails(data.reportDetails);
            
            setExaminationDate(data.examinationDate);
            setReportDate(data.reportDate);
            setIsEditing(true);
            fetchPatientNames(data.phoneNumber);
            fetchExamReports(data.phoneNumber, data.patientName);
            
          } else {
            alert("Patient record not found!");
            navigate(0);
          }
        } catch (error) {
          console.error("Error fetching patient data: ", error);
        }
      };

      fetchPatientData();
    }
  }, [id, navigate]);
  
  // Function to fetch patient names
  const fetchPatientNames = async (number) => {
    try {
      const prescriptionsQuery = query(
        collection(db, "Patient"),
        where("patient_phone_number", "==", number)
      );
      const prescriptionSnapshot = await getDocs(prescriptionsQuery);

      if (!prescriptionSnapshot.empty) {
        const patients = [
          ...new Set(prescriptionSnapshot.docs.map((doc) => doc.data().patient_name)),
        ];
        setPatientOptions(patients.map((name) => ({ patient_name: name })));
      } else {
        alert("Patient names Not Found");
      }
    } catch (error) {
      console.error("Error fetching patient names:", error);
    }
  };

  // Function to fetch patient examination reports
  const fetchExamReports = async (number, patientName) => {
    try {
      const prescriptionsQuery = query(
        collection(db, "prescriptions"),
        where("phoneNumber", "==", number),
        where("patientName", "==", patientName)
      );
      const prescriptionSnapshot = await getDocs(prescriptionsQuery);

      if (!prescriptionSnapshot.empty) {
        const reports = prescriptionSnapshot.docs.map((doc) => {
          const data = doc.data();
          setPatientId(data.patient_id);
          setReportName(data.radiographReports);
          setExaminationDate(data.createdAt);
          return `${data.createdAt} --- ${data.radiographReports}`;
        });
        setExamReports(reports);
      } else {
        setExamReports([]);
      }
    } catch (error) {
      console.error("Error fetching examination reports:", error);
      setExamReports([]);
    }
  };
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFile(file);
    
  };
  // 🔹 Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!phoneNumber || !selectedPatient ||  !reportDetails || !file  || !reportDate ) {
      alert("Please fill in all fields and upload a file.");
      return;
    }

    


    try {
      const fileName = `${Date.now()}_${file.name}`;
      const imageRef = ref(storage, `Patients Lab Reports/${fileName}`);
      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);

      const formatUploadedDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
    
        return `${year}_${month}_${day}`;
    };
    
    // Example usage
      const uploadedDate = new Date(); // Replace with your actual date
      const formattedDate = formatUploadedDate(uploadedDate);
      const formattedTime = uploadedDate.toLocaleTimeString();

      if (isEditing) {
        const patientDocRef = doc(db, "Patients Lab Reports", id);
        const patientDoc = await getDoc(patientDocRef);
        const oldImageUrl = patientDoc.data().imageUrl;

        if (oldImageUrl) {
          const oldImageRef = ref(storage, oldImageUrl);
          await deleteObject(oldImageRef);
        }

        await updateDoc(patientDocRef, {
          patientId,
          phoneNumber,
          patientName :selectedPatient,
          reportName,
          reportDetails,
          imageUrl,
          fileName,
          examinationDate,
          reportDate,
          uploadDate: formattedDate,
          uploadTime: formattedTime,
        });

        alert("Patient report updated successfully!");
      } else {
        await addDoc(collection(db, "Patients Lab Reports"), {
          phoneNumber,
          patientId,
          patientName : selectedPatient,
          reportName,
          reportDetails,
          imageUrl,
          fileName,
          examinationDate,
          reportDate,
          uploadDate: formattedDate,
          uploadTime: formattedTime,
        });

        alert("Patient report added successfully!");
        
      }

      setPatientId("");
      setSelectedPatient("");
      setReportName("");
      
      
      setFile(null);
      
      setExaminationDate("");
      setReportDate("");

      navigate(0);
    } catch (error) {
      console.error("Error saving data: ", error);
      alert("Failed to save data. Error: " + error.message);
    }
  };

  return (
    <div className="card-box xs-pd-20-10 pd-ltr-20" style={{ marginBottom: "10px" }}>
      <form>
        <h3>Lab Reports Upload</h3>
        <div className="row">
          <div className="col-md-4 col-sm-12">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                className="form-control"
                value={phoneNumber}
                
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) e.preventDefault();
                }}
                onInput={(e) => {
                  let value = e.target.value.replace(/[^0-9]/g, "");
                  if (value.length > 10) value = value.slice(0, 10);
                  if (value.length === 10 && parseInt(value) < 6200000000) {
                    alert("Number must be greater than 6200000000");
                    value = "";
                  }
                  setPhoneNumber(value);
                }}
                onBlur={() => {
                  if (phoneNumber.length === 10) fetchPatientNames(phoneNumber);
                }}
              />
            </div>
          </div>

          <div className="col-md-4 col-sm-12">
            <div className="form-group">
              <label>Patient Name</label>
              <select
                className="form-control"
                value={selectedPatient} // Ensure the selected value is controlled
                 
                onChange={(e) => {
                  const selected = e.target.value;
                  setSelectedPatient(selected);
                  setExamReports([]); // Reset reports
                  if (selected !== "Other") {
                    fetchExamReports(phoneNumber, selected); // Fetch new reports
                  }
                }}
              >
                <option value="">Select Patient</option>
                {patientOptions.map((patient, index) => (
                  <option key={index} value={patient.patient_name}>
                    {patient.patient_name}
                  </option>
                ))}
              </select>

            </div>
          </div>

          <div className="col-md-4">
            <div className="form-group">
              <label>Examination Reports</label>
              <select
                className="form-control"
                value={selectedExamReport}
                
                onChange={(e) => setSelectedExamReport(e.target.value)}
              >
                <option value="">Select Report</option>
                {examReports.map((report, index) => (
                  <option key={index} value={report}>
                    {report}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-4 col-sm-12">
            <div className="form-group">
              <label>Report Details</label>
              <input
                type="text"
                className="form-control"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-4 col-sm-12">
            <div className="form-group">
              <label>Issue Date</label>
              <input
                type="date"
                className="form-control"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-4 col-sm-12">
            <div className="form-group">
              <label>Upload Invoice (PDF/JPG)</label>
              <input
                type="file"
                className="form-control"
                accept=".pdf, .jpg, .jpeg, .png"
                
                onChange={handleImageChange}
                
              />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-10 text-center" style={{ marginBottom: "10px" ,display:"flex", gap:"15px"}}>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>
              Submit
            </button>
            <button type="button" className="btn btn-primary"  onClick={() => setIsVisible(false)} >
              cancel
              </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
