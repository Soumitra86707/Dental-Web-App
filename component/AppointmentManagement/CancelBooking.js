import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./DoctorCancel.css";
import { db } from "../Config/FirebaseConfig";
import { toast } from "react-toastify";
const DoctorCancel = () => {
  const [selectedDate, setSelectedDate] = useState(new Date()); // Set initially to today's date
  const [loading, setLoading] = useState(true);
  const [bookedSlotsData, setBookedSlotsData] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);

  useEffect(() => {
    const appointmentsCollection = collection(db, "Appointments");
    const appointmentsQuery = query(appointmentsCollection, orderBy("appointment_date", "desc"));
  
    const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
      const appointmentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      setBookedSlotsData(appointmentsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching appointments:", error.message);
      setLoading(false);
    });
  
    return () => unsubscribe(); // Cleanup on unmount
  }, []);
  useEffect(() => {
    if (selectedDate && bookedSlotsData.length > 0) {
      const formattedDate = selectedDate.toLocaleDateString("en-CA").replace(/-/g, "_");
      const currentTime = new Date();
      
      const selectedData = bookedSlotsData.filter((item) => {
        const appointmentDate = new Date(item.appointment_date.replace(/_/g, "-"));
        const appointmentTime = new Date(`${appointmentDate.toDateString()} ${item.slot_start_time}`);
        
        return item.appointment_date === formattedDate && appointmentTime >= currentTime;
      });
  
      // Sort appointments by slot_start_time
      selectedData.sort((a, b) => {
        const timeA = new Date(`1970-01-01T${a.slot_start_time}`);
        const timeB = new Date(`1970-01-01T${b.slot_start_time}`);
        return timeA - timeB;
      });
  
      setBookedSlots(selectedData);
      setSelectedSlots([]);
    }
  }, [selectedDate, bookedSlotsData]);
  

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleSlotClick = (slot) => {
    setSelectedSlots((prevSelected) =>
      prevSelected.includes(slot)
        ? prevSelected.filter((s) => s !== slot)
        : [...prevSelected, slot]
    );
  };

  const handleCancel = async () => {
    if (selectedDate && selectedSlots.length > 0) {
      for (const slot of selectedSlots) {
        const docRef = doc(db, "Appointments", slot.id);
        await deleteDoc(docRef);
      }

      const updatedSlots = bookedSlots.filter(
        (slot) => !selectedSlots.includes(slot)
      );
      setBookedSlots(updatedSlots);
      setSelectedSlots([]);
              toast.success("Selected appointments have been canceled!", {
                autoClose: 3000, // 10 seconds
                className: "custom-toast",
                closeOnClick: false,
                draggable: false,
                progress: undefined,
              });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
        <div className="main-container ">
            <div className="xs-pd-20-10 pd-ltr-20" style={{ padding: "10px",backgroundColor:"#FFF7DE" }}>
                <div className="card-box pb-10 " style={{ padding: "10px",backgroundColor:"#FFF7DE" , color:"#4B4B4B"}}>
                    <div className="row">
                        <div className="col-md-6 col-sm-12">
                            <div className="calendar-container" style={{ paddingTop: "60px" }}>
                                <Calendar
                                    onChange={handleDateChange}
                                    value={selectedDate}
                                    minDate={new Date()}
                                />
                            </div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                            {selectedDate && (
                                <div className="slots-container" style={{ paddingTop: "40px" }}>
                                    <h3 style={{ textAlign: "center" }}>Booked Slots on {selectedDate.toDateString()}</h3>
                                    {bookedSlots.length > 0 ? (
                                        <div className="slots " style={{ paddingTop: "40px" }}>
                                            {bookedSlots.map((slot) => (
                                                <button
                                                    key={slot.id}
                                                    className={`slot ${selectedSlots.includes(slot) ? "selected" : ""}`}
                                                    onClick={() => handleSlotClick(slot)}
                                                >
                                                    {`${slot.slot_start_time} - ${slot.slot_end_time}`}
                                                    <br />
                                                    {slot.patient_name}
                                                    <br />
                                                    {slot.reason_for_visit}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>No booked slots on this date.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    {selectedSlots.length > 0 && (
                        <div className="row">
                            <div className="col-md-5 col-sm-12"></div>
                            <div className="col-md-6 col-sm-12" style={{ textAlign: "center" }}>
                                <button className="cancel-btn" onClick={handleCancel}>
                                    Cancel Selected Slots
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default DoctorCancel;
