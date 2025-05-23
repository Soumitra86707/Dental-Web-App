import { useState ,useEffect } from "react";
import { db } from "../Config/FirebaseConfig"; // Ensure you have Firebase configured
import {doc, getDocs, query, where, updateDoc,  collection, addDoc, arrayUnion ,getDoc,orderBy,limit } from "firebase/firestore";
import "../../vendors/styles/core.css";
import "../../vendors/styles/icon-font.min.css";
import "../../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../../plugins/datatables/css/responsive.bootstrap4.min.css";
import "../../vendors/styles/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { format } from "date-fns";
import { useParams ,useNavigate} from "react-router-dom";

function Prescription() {
    const { appointmentId } = useParams(); // Get the appointment ID from the URL
    /* const [appointment, setAppointment] = useState(null); */
    const [patientsId, setPatientId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [age, setAge] = useState("");
    const [patientName, setPatientName] = useState("");
    const [chiefComplaint, setChiefComplaint] = useState("");
    const [onExamination, setOnExamination] = useState("");
    const [radiographReports, setRadiographReports] = useState("");
    const [proposedTreatmentPlan, setProposedTreatmentPlan] = useState("");
    const [diagnosticReports, setDiagnosticReports] = useState("");
    const [paymentDetails,setPaymentDetails] = useState("");
    const [followUpDate, setFollowUpDate] = useState("");
    const [appointmentDate , setAppointmentDate] = useState("");
    const [entries, setEntries] = useState([
        {
          id: 1,
          type: "tablet",
          specificName: "pan",
          name: "",
          dosage: "",
          days: "",
          times: [],
          food: "before",
        },
      ]);
      const navigate =useNavigate();
      useEffect(() => {
        const fetchAppointmentDetails = async () => {
            try {
                // Fetch current appointment details
                const appointmentRef = doc(db, "Appointments", appointmentId);
                const docSnap = await getDoc(appointmentRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    /* setAppointment(data); */
                    setPhoneNumber(data.patient_account_id);
                    setPatientName(data.patient_name);
                    setAppointmentDate(data.appointment_date);
                    setAge(data.age);
                    setChiefComplaint(data.reason_for_visit);
                    setPatientId(data.patient_id);
                    
                    // Fetch the most recent prescription based on patient_id & reasonForVisit
                     fetchLatestPrescription(data.patient_id, data.reason_for_visit); 
                } else {
                    console.error("No such appointment found!");
                }
            } catch (error) {
                console.error("Error fetching appointment:", error);
            } finally {
                setLoading(false);
            }
        };

        

const fetchLatestPrescription = async (patientId, reasonForVisit) => {
    if (!patientId || !reasonForVisit) {
        console.error("Invalid patientId or reasonForVisit");
        return;
    }

   

    try {
        const prescriptionsRef = collection(db, "prescriptions");
        const q = query(
            prescriptionsRef,
            where("patient_id", "==", patientId),
            where("reason_for_visit", "==", reasonForVisit), // Ensure correct field name
             orderBy("createdAt", "desc"), // Requires Firestore index 
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const latestPrescription = querySnapshot.docs[0].data();
            

            if (latestPrescription.medicine) {
                setEntries(latestPrescription.medicine);
                
                setOnExamination(latestPrescription.onExamination);
                setRadiographReports(latestPrescription.radiographReports);
                setProposedTreatmentPlan(latestPrescription.proposedTreatmentPlan);
                setDiagnosticReports(latestPrescription.diagnosticReports);
                
            }
        } else {
            console.log("No prescription found.");
        }
    } catch (error) {
        console.error("Error fetching prescription:", error);
    }
    };


        fetchAppointmentDetails();
    }, [appointmentId]);
    if(loading)
        {
            return (<div >Loading ......</div>)
        }

    const addEntry = () => {
        setEntries([...entries, { id: Date.now(), type: "tablet", name: "", specificName: "", dosage: "", days: "", times: [], food: "before" }]);
    };

    const removeEntry = (id) => {
        setEntries(entries.filter((entry) => entry.id !== id));
    };

    const updateEntry = (id, field, value) => {
        setEntries(entries.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)));
    };

    const toggleTime = (id, timeValue) => {
        setEntries(entries.map((entry) => {
            if (entry.id === id) {
                const updatedTimes = entry.times.includes(timeValue)
                    ? entry.times.filter((t) => t !== timeValue)
                    : [...entry.times, timeValue];
                return { ...entry, times: updatedTimes };
            }
            return entry;
        }));
    };

    const submitForm = async () => {
        try {
            const currentDate = new Date();
            const formattedDate = format(currentDate, "yyyy_MM_dd"); // Format as yyyy_mm_dd
            const formattedTime = format(currentDate, "HH:mm:ss"); // Format as HH:mm:ss
            const prescriptionRef = await addDoc(collection(db, "prescriptions"), {
                patient_id: patientsId,
                appointment_date: appointmentDate,
                age,
                phoneNumber,
                patientName,
                reason_for_visit: chiefComplaint,
                onExamination,
                radiographReports,
                proposedTreatmentPlan,
                medicine: entries,
                diagnosticReports,
                paymentDetails,
                followUpDate,
                createdAt: formattedDate,  // Store the formatted date
                createdTime: formattedTime  // Store the formatted time
            });
            const prescriptionId = prescriptionRef.id; // Get the newly created prescription ID
            const prescriptionDocRef = doc(db, "prescriptions", prescriptionId);
            await updateDoc(prescriptionDocRef, { prescriptionId });
        // Check if there's an existing entry in "reason_for_visit"
        const reasonForVisitRef = collection(db, "reason_for_visit");
        const q = query(
            reasonForVisitRef,
            where("phoneNumber", "==", phoneNumber),
            where("patientName", "==", patientName),
            where("reason_for_visit", "==", chiefComplaint)
        );
        
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // If a matching record exists, update it with prescriptionId
            querySnapshot.forEach(async (docSnap) => {
                const docRef = doc(db, "reason_for_visit", docSnap.id);
                await updateDoc(docRef, {
                    createdAt: arrayUnion(formattedDate),
                    prescriptionIds: arrayUnion(prescriptionId)
                });
            });
        } else {
            // If no matching record, create a new one with appointmentId
            await addDoc(reasonForVisitRef, {
                createdAt: arrayUnion(formattedDate),
                phoneNumber,
                patientName,
                patient_id: patientsId,
                reason_for_visit: chiefComplaint,
                prescriptionIds: arrayUnion(prescriptionId) // Assuming appointmentId comes from prescriptionId
            });
        }
        let TotalAmount = 500;
        let paidAmount = Number(paymentDetails); // Ensure it's a number
        
        let dueAmount = paidAmount >= TotalAmount ? 0 : TotalAmount - paidAmount;
              
     
        
        
        await addDoc(collection(db, "Earning"), {
            patient_id:patientsId,
            invoiceId:prescriptionId,
            phoneNumber,
            paymentType:"Patient",
            paymentBy: patientName,
            TotalAmount:TotalAmount,
            PaidAmount: paymentDetails,
            dueAmount:dueAmount,
            paymentTo:"Dr. Nithya",

            createdAt: formattedDate,  // Store the formatted date
            createdTime: formattedTime  // Store the formatted time
        });

            alert("Prescription submitted successfully!");
            navigate(`/Prescription/Download/${prescriptionId}`);

            setEntries([]); // Clear medicine entries
            setPhoneNumber("");
            setPatientName("");
            setChiefComplaint("");
            setOnExamination("");
            setRadiographReports("");
            setProposedTreatmentPlan("");
            setDiagnosticReports("");
            setPaymentDetails("");
            setFollowUpDate("");
        } catch (error) {
            console.error("Error submitting prescription: ", error);
            alert("Failed to submit prescription.");
        }
    };

    return (
        <div className="App">
            <div className="main-container">
            <div className="xs-pd-20-10 pd-ltr-20" style={{ padding: "10px",backgroundColor:"#FFF7DE" , color:"#4B4B4B"}}>
            <div className="p-6 card-box mb-6" style={{ padding: "10px",backgroundColor:"#FFF7DE" , color:"#4B4B4B"}}>
                <div className="card-box xs-pd-20-10 pd-ltr-20" style={{
                    padding: "10px",
                    background: "linear-gradient(to top left,rgb(233, 216, 164),rgb(247, 243, 232))", 
                    color: "#4B4B4B"
                    }}>
                        <div className="row pb-10">
                        <div className="col-md-12 mb-20">
                    <form >
                    <h3>Personal Details</h3>  
                        <div className="row">
                            <div className="col-md-4 col-sm-12">
                                <div className="form-group" >
                                    <label>Phone Number</label>
                                    <input type="text" className="form-control" 
                                    onKeyPress={(e) => {
                                        if (!/[0-9]/.test(e.key)) {
                                            e.preventDefault(); // Blocks non-numeric keys
                                        }
                                    }}
                                    onInput={(e) => {
                                        let value = e.target.value.replace(/[^0-9]/g, ""); // Allow only numbers
                                        if (value.length > 10) {
                                            value = value.slice(0, 10); // Restrict to 10 digits
                                        }
                                        if (value.length === 10 && parseInt(value) < 6200000000) {
                                            alert("Number must be greater than 6200000000"); 
                                            value = ""; // Reset the input if it doesn't meet the condition
                                        }
                                        e.target.value = value;
                                        
                                    }}
                                    style={{background:"transparent"}}
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    readOnly 
                                    />
                                </div>
                            </div>
                            <div className="col-md-4 col-sm-12">
                                <div className="form-group">
                                    <label>Patient Name</label>
                                    <input type="text" className="form-control" value={patientName} onChange={(e) => setPatientName(e.target.value)}/>
                                </div>
                            </div>
                            <div className="col-md-4 col-sm-12">
                                <div className="form-group" style={{ cursor: "not-allowed" }}>
                                    <label>Chief Complaint</label>
                                    <input type="text" className="form-control" value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} readOnly />
                                </div>
                            </div>
                        </div>
                        <h3>Diagnosis Details</h3>
                        <div className="row">

                            <div className="col-md-6 col-sm-12">
                                <div className="form-group">
                                    <label>On Examination</label>
                                    <input type="text" className="form-control" value={onExamination} onChange={(e) => setOnExamination(e.target.value)}/>
                                </div>
                            </div>
                        </div>
                        <h3>Treatment Details</h3>
                        <div className="row">
                            <div className="col-md-6 col-sm-12">
                                <div className="form-group">
                                    <label>Radiograph Reports</label>
                                    <input type="text" className="form-control" value={radiographReports} onChange={(e) => setRadiographReports(e.target.value)}/>
                                </div>
                            </div>
                            <div className="col-md-6 col-sm-12">
                                <div className="form-group">
                                    <label>Proposed Treatment Plan</label>
                                    <input type="text" className="form-control" value={proposedTreatmentPlan} onChange={(e) => setProposedTreatmentPlan(e.target.value)}/>
                                </div>
                            </div>
                        </div>
                        
                        <h3>Medicine Details</h3>
                        {entries.map((entry) => (
                            <div className="row" key={entry.id}>
                                <div className="col-md-1 col-sm-12">
                                    <label>Type</label>
                                    <select className="form-control" value={entry.type} onChange={(e) => updateEntry(entry.id, "type", e.target.value)} required>
                                        <option value="tablet">Tablet</option>
                                        <option value="syrup">Syrup</option>
                                    </select>
                                </div>
                                <div className="col-md-1 col-sm-12">
                                    <label>Name</label>
                                    {entry.type === "tablet" ? (
                                        <select className="form-control" value={entry.specificName} onChange={(e) => updateEntry(entry.id, "specificName", e.target.value)} required>
                                            <option value="">select</option>
                                            <option value="pan">Pan</option>
                                            <option value="lan">Lan</option>
                                            <option value="other">Other</option>
                                        </select>
                                    ) : entry.type === "syrup" ? (
                                        <select className="form-control" value={entry.specificName} onChange={(e) => updateEntry(entry.id, "specificName", e.target.value)} required>
                                            <option value="">select</option>
                                            <option value="syrup1">Syrup1</option>
                                            <option value="syrup2">Syrup2</option>
                                            <option value="other">Other</option>
                                        </select>
                                    ) : null}
                                    
                                </div>
                               
                                {entry.specificName === "other" && (
                                    <div className="col-md-2 col-sm-12">
                                    <div className="form-group">
                                        <label style={{alignItems:"center", textAlign:"center"}}>Medicine</label>
                                        <input type="text" className="form-control" placeholder="Enter medicine name" value={entry.name} onChange={(e) => updateEntry(entry.id, "name", e.target.value)} />
                                    </div>
                                </div>                                    )}

                                <div className={entry.specificName === "other" ? "col-md-1 col-sm-12" : "col-md-2 col-sm-12"}>
                                    <label>Dosage</label>
                                    <input type="text" className="form-control" value={entry.dosage} onChange={(e) => updateEntry(entry.id, "dosage", e.target.value)} placeholder={entry.type === "tablet" ? "500mg" : "500ml"}  onKeyPress={(e) => {
                                        if (!/[0-9]/.test(e.key)) {
                                        e.preventDefault(); // Blocks non-numeric keys
                                        }
                                    }} required/>
                                </div>
                                <div className={entry.specificName === "other" ? "col-md-1 col-sm-12" : "col-md-1 col-sm-12"}>
                                    <label>Days</label>
                                    <input type="text" className="form-control" value={entry.days }  onChange={(e) => updateEntry(entry.id, "days", e.target.value)}  onInput={(e) => {
                                        e.target.value = e.target.value.replace(/[^0-9]/g, ""); // Remove non-numeric characters
                                    }} placeholder="0" required/>
                                </div>
                                <div className="col-md-4 col-sm-12"/* {entry.specificName === "other" ? "col-md-2 col-sm-12" : "col-md-3 col-sm-12"} */>
                                    <div className="form-group">
                                            <label>Time</label>
                                            <div className="d-flex flex-wrap">
                                                {["sos", "morning", "afternoon", "night"].map((time, index) => (
                                                    <div
                                                    key={time}
                                                    className={`form-check ${index % 2 === 1 ? "me-0" : "me-2"}`} // Ensures 2 items per row
                                                    style={{
                                                        marginRight: entry.specificName === "other" ? "4px" : "12px", // Adjusts spacing
                                                        minWidth: "calc(50% - 6px)" // Ensures two items per row
                                                    }}
                                                    >
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={entry.times.includes(time)}
                                                        onChange={() => toggleTime(entry.id, time)}
                                                    />
                                                    <label
                                                        className="form-check-label"
                                                        style={{
                                                        marginLeft: entry.specificName === "other" ? "2px" : "6px" // Less gap for col-md-2
                                                        }}
                                                    >
                                                        {time}
                                                    </label>
                                                    </div>
                                                ))}
                                            </div>
                                    </div>
                                </div>

                                <div className={entry.specificName === "other" ? "col-md-1 col-sm-12" : "col-md-2 col-sm-12"}>
                                    <label>Food</label>
                                    <select className="form-control" value={entry.food} onChange={(e) => updateEntry(entry.id, "food", e.target.value)}>
                                        <option value="before">Before Food</option>
                                        <option value="after">After Food</option>
                                    </select>
                                </div>
                                <div className="col-md-1 col-sm-12 d-flex align-items-center">
                                            <button type="button" className="btn btn-danger" onClick={() => removeEntry(entry.id)}>-</button>
                                        </div>
                            </div>
                        ))}
                        
                        <div className="mt-3">
                                <button type="button" className="btn btn-primary" onClick={addEntry}>+</button>
                        </div>
                        <h2>Diagnostic Lab</h2>
                        <div className="row">
                            <div className="col-md-6 col-sm-12">
                                <div className="form-group">
                                    <label>Diagnostic Reports</label>
                                    <input type="text" className="form-control" value={diagnosticReports} onChange={(e) => setDiagnosticReports(e.target.value)}/>
                                </div>
                            </div>
                        <h2>Payment & Follow-Up Date</h2>
                        </div><div className="row">
                            <div className="col-md-6 col-sm-12">
                                <div className="form-group">
                                    <label>Payment</label>
                                    <input type="text" className="form-control" value={paymentDetails} onChange={(e) => setPaymentDetails(e.target.value)}/>

                                </div>
                            </div>
                            <div className="col-md-5 col-sm-12">
                                <div className="form-group">
                                    <label>Follow-Up_Date(if needed)</label>
                                    <input type="date" className="form-control" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)}/>
                                </div>
                            </div>
                        </div>
                        
                        <hr />
                        <div className="mt-4">
                            <button  type="button"className="btn btn-success mt-3 ms-3" onClick={submitForm} >Submit</button>
                        </div>
                        
                    </form>
                    </div>
                    
                    </div>
                </div>
                </div>
                </div>
            </div>
        </div>
    );
}

export default Prescription;
