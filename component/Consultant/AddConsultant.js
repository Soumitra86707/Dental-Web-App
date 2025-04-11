import React from 'react';
import styled from 'styled-components';
import { useState, useEffect } from "react";
import { db, storage } from "../Config/FirebaseConfig";
import { collection, addDoc, updateDoc, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useParams ,useNavigate} from 'react-router-dom';
import "../../vendors/styles/core.css";
import "../../vendors/styles/icon-font.min.css";
import "../../plugins/datatables/css/dataTables.bootstrap4.min.css";
import "../../plugins/datatables/css/responsive.bootstrap4.min.css";
import "../../vendors/styles/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
// Styled Components with improved styling



const Textarea = styled.textarea`
  width: 98%;
  height: 120px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  font-family: 'Poppins', sans-serif;
  resize: none;
  transition: all 0.3s ease;
  &:focus {
    border-color: #03c1c0;
    box-shadow: 0 0 5px rgba(3, 193, 192, 0.5);
  }
`;

const Button = styled.button`
background: linear-gradient(90deg,#026f70, #03c0c1);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  font-weight: 600;
  
  transition: all 0.3s ease;
  &:hover {
    background: linear-gradient(90deg, #03c0c1,#026f70);
    box-shadow: 0 4px 12px rgba(1, 87, 155, 0.3);
  }
`;


const AddConsultant = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fname, setfName] = useState('');
  const [lname, setlName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [availability, setAvailability] = useState([]); 
  const [experience, setExperience] = useState({ years: '', months: '' });
  const [additionalInformation, setAdditionalInformation] = useState('');
  const [photo, setPhoto] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState('');
  const [oldPhotoURL, setOldPhotoURL] = useState('');

  useEffect(() => {
    if (id) {
      
      const fetchConsultant = async () => {
        const docRef = doc(db, 'consultants', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setfName(data.fname);
          setlName(data.lname);
          setEmail(data.email);
          setContact(data.phone);
          setSpecialty(data.specialty);
          setAvailability(data.availability);
          setExperience(data.experience);
          setAdditionalInformation(data.AdditionalInformation);
          setPreviewPhoto(data.photoURL);
          setOldPhotoURL(data.photoURL); // Store old photo URL
        }
      };
      fetchConsultant();
    }
  }, [id]);

  const handleAvailabilityChange = (day) => {
    setAvailability((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  function generateUserId(firstName, lastName, number) {
    if (!firstName || !lastName || !number) {
      return "Invalid input";
    }
    const firstPart = firstName.substring(0, 2).toUpperCase();
    const lastPart = lastName.substring(0, 2).toUpperCase();
    const numberPart = number.toString().substring(0, 4);
    return `${firstPart}${lastPart}${numberPart}`;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let photoURL = previewPhoto; // Default to existing photo

      if (photo) {
        // Delete old photo from storage (if exists)
        if (oldPhotoURL) {
          const oldPhotoRef = ref(storage, oldPhotoURL);
          try {
            await deleteObject(oldPhotoRef);
            
          } catch (error) {
            console.warn("Error deleting old photo:", error);
          }
        }

        // Upload new photo
        const fileName = `${Date.now()}_${photo.name}`;
        const storageRef = ref(storage, `consultantPhotos/${fileName}`);
        await uploadBytes(storageRef, photo);
        photoURL = await getDownloadURL(storageRef);
      }

      const consultantData = {
        fname,
        lname,
        email,
        phone: contact,
        specialty,
        availability,
        experience: {
          years: parseInt(experience.years, 10),
          months: parseInt(experience.months, 10),
        },
        AdditionalInformation: additionalInformation,
        photoURL,
        updatedAt: new Date(),
      };

      if (id) {
        // Update existing consultant
        await updateDoc(doc(db, "consultants", id), consultantData);
        alert("Consultant updated successfully!");
      } else {
        // Add new consultant
        const consultantId = generateUserId(fname, lname, contact);
        const newDocRef = await addDoc(collection(db, "consultants"), {
          ...consultantData,
          consultantId,
          createdAt: new Date(),
        });

        // Update Firestore with the generated ID
        await updateDoc(doc(db, "consultants", newDocRef.id), {
          id: newDocRef.id,
        });

        alert("Consultant added successfully!");
      }

      // Reset state
      setfName("");
      setlName("");
      setSpecialty("");
      setContact("");
      setEmail("");
      setAvailability([]);
      setAdditionalInformation("");
      setExperience({ years: "", months: "" });
      setPhoto(null);
      setPreviewPhoto("");
      setOldPhotoURL("");

      navigate(`/Consultant/View`);
    } catch (error) {
      console.error("Error saving consultant:", error);
      alert("Failed to save consultant.");
    }
  };

  return (
    <div className="App">
      <div className="main-container">
        <div className="xs-pd-20-10 pd-ltr-20" style={{ padding: "10px",backgroundColor:"#FFF7DE" , color:"#4B4B4B"}}>
          <div className="p-6 card-box mb-6" style={{ padding: "10px",backgroundColor:"#FFF7DE" , color:"#4B4B4B"}}>
            <div className="card-box xs-pd-20-10 pd-ltr-20" style={{ padding: "10px",  background: "linear-gradient(to top left,rgb(233, 216, 164),rgb(247, 243, 232))", color: "#4B4B4B"}}>
              <div className="row pb-10" >
                <form onSubmit={handleSubmit}>
                  <h1>Enter The Consultant Details</h1>
                  
                  <div className="row "  >
                  <div className="col-md-4 mb-20" style={{
                      
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      
                    }}>
                    <div style={{
                      position: 'relative',
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      backgroundColor: '#f0f0f0',
                      overflow: 'hidden',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                    }}>
                      {previewPhoto ? (
                        <img 
                          src={previewPhoto} 
                          alt="Consultant Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <span style={{ color: '#aaa' }}>No Photo</span>
                      )}

                      <label htmlFor="photoUpload" 
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          
                          borderRadius: '50%',
                          width: '30px',
                          height: '30px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          color: 'black',
                          cursor: 'pointer',
                          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                          fontSize: '20px',
                          fontWeight: 'bold'
                        }}>
                        +
                      </label>
                      <input 
                        id="photoUpload" 
                        type="file" 
                        onChange={handlePhotoChange} 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                      />
                    </div>
                  </div>
                  <div className="col-md-4 mb-20">
                    <div className="col-md-12 col-sm-12">
                      <div className="form-group">
                        <label>First Name</label>
                        <input type="text" className="form-control" value={fname} onChange={(e) => setfName(e.target.value)} required/>
                      </div>
                    </div>
                    
                    <div className="col-md-12 col-sm-12">
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={contact} 
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                            setContact(value);
                          }} 
                          onBlur={() => {
                            if (contact.length !== 10) {
                              alert('Phone number must be 10 digits long.');
                            }
                          }}
                          required
                        />
                      </div>
                    </div>
                    
                    
                  </div>
                  <div className="col-md-4 mb-20">
                  <div className="col-md-12 col-sm-12">
                      <div className="form-group">
                        <label>Last Name</label>
                        <input type="text" className="form-control" value={lname} onChange={(e) => setlName(e.target.value)} required/>
                      </div>
                    </div>
                    <div className="col-md-12 col-sm-12">
                      <div className="form-group">
                        <label>Email</label>
                        <input type="text" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required/>
                      </div>
                    </div>

                    
                  </div>
                  </div>
                  <div className="row">
                      <div className="col-md-4 col-sm-12">
                        <div className="form-group">
                          <label>Specialty:</label>
                          <select className="form-control" value={specialty} onChange={(e) => setSpecialty(e.target.value)} required>
                            <option value="">Select Specialty</option>
                            <option value="Orthodontist">Orthodontist</option>
                            <option value="Periodontist">Periodontist</option>
                            <option value="Endodontist">Endodontist</option>
                            <option value="Prosthodontist">Prosthodontist</option>
                            <option value="Oral Surgeon">Oral Surgeon</option>
                            <option value="Pediatric Dentist">Pediatric Dentist</option>
                            <option value="Cosmetic Dentist">Cosmetic Dentist</option>
                            <option value="General Dentist">General Dentist</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4 col-sm-12">
                        <div className="form-group">
                          <label>Years:</label>
                          <input
                            type="text"
                            value={experience.years}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Allow empty string or numeric values only
                              if (value === '' || /^[0-9]+$/.test(value)) {
                                setExperience((prev) => ({ ...prev, years: value }));
                              }
                            }}
                            className="form-control"
                            
                          />
                        </div>
                      </div>

                      <div className="col-md-4 col-sm-12">
                        <div className="form-group">
                          <label>Months: </label>
                          <input
                            type="text"
                            value={experience.months}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Allow empty string or numbers between 0 and 11
                              if (value === '' || (/^(0|[1-9]|1[0-1])$/.test(value))) {
                                setExperience((prev) => ({ ...prev, months: value }));
                              }
                            }}
                            className="form-control"
                            required
                          />
                        </div>
                      </div>

                  </div>
                  
                  <div className="row">
                    <div className="col-md-12 col-sm-12">
                      <div className="form-group">
                        <label>Availability:</label>
                        <div style={{display:"flex",gap:"20px"}}>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                            <div key={day}className="col-md-1 col-sm-12" style={{display:"flex",gap:"5px"}}>
                              <input
                                type="checkbox"
                                value={day}
                                onChange={() => handleAvailabilityChange(day)}
                                checked={availability.includes(day)}
                                
                              /> {day}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-12 col-sm-12">
                      <div className="form-group">
                        <label>Additional Information:</label>
                        <Textarea
                          value={additionalInformation}
                          onChange={(e) => setAdditionalInformation(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row" style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <div className="col-md-4 col-sm-12" style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <Button type="submit">Add Consultant</Button>
                      </div>
                    </div>
                  
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddConsultant;
