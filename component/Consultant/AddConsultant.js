import React, { useState } from 'react';
import styled from 'styled-components';
import { db, storage } from '../Config/FirebaseConfig'; // Import Firebase configurations
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Styled Components with improved styling

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(to bottom, #a0c4ff, aqua);
  
  padding: 20px;
`;

const Form = styled.form`
  max-width: 1500px;
 
  background: linear-gradient(135deg, #dde879,#9dc8ec);
  padding: 10px 30px;
  max-height: 1500px;
  margin-top:36px;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  overflow: hidden;
`;

const Heading = styled.h2`
  text-align: center;
  margin-top: 30px;
  margin-bottom: 20px;
  color: #0277bd;
  font-family: 'Poppins', sans-serif;
  font-size: 1.8rem;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
  font-family: 'Poppins', sans-serif;
`;

const Input = styled.input`
  width: 91%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  font-family: 'Poppins', sans-serif;
  transition: all 0.3s ease;
  &:focus {
    border-color: #03c1c0;
    box-shadow: 0 0 5px rgba(3, 193, 192, 0.5);
  }
`;

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
  margin-left:265px;
  transition: all 0.3s ease;
  &:hover {
    background: linear-gradient(90deg, #03c0c1,#026f70);
    box-shadow: 0 4px 12px rgba(1, 87, 155, 0.3);
  }
`;

const ImgPreview = styled.img`
  margin-top: 10px;
  border-radius: 50%;
  width: 120px;
  height: 120px;
  object-fit: cover;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #03c1c0;
`;

const PrimaryDetailsContainer = styled.div`
  display: flex;
  gap: 20px;
  background: linear-gradient(135deg, #dde879,#9dc8ec);
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  background-color: #f4f4f4;
`;

const SecondaryDetailsContainer = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 15px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  font-family: 'Poppins', sans-serif;
  transition: all 0.3s ease;
  &:focus {
    border-color: #03c1c0;
    box-shadow: 0 0 5px rgba(3, 193, 192, 0.5);
  }
`;

const AddConsultant = ({ onAddConsultant }) => {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [availability, setAvailability] = useState('');
  const [AdditionalInformation, setAdditionalInformation] = useState('');
  const [experience, setExperience] = useState({ years: '', months: '' });
  const [photo, setPhoto] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let photoURL = '';

      if (photo) {
        const storageRef = ref(storage, `consultantPhotos/${photo.name}`);
        const uploadTask = uploadBytesResumable(storageRef, photo);
        uploadTask.on(
          'state_changed',
          null,
          (error) => {
            console.error('Error uploading photo: ', error);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            photoURL = url;
          }
        );
      }

      await addDoc(collection(db, 'consultants'), {
        name,
        email: contact,
        phone,
        specialty,
        availability,
        experience: {
          years: parseInt(experience.years, 10),
          months: parseInt(experience.months, 10),
        },
        AdditionalInformation,
        photoURL,
        createdAt: new Date(),
      });

      setName('');
      setSpecialty('');
      setContact('');
      setPhone('');
      setAvailability('');
      setAdditionalInformation('');
      setExperience({ years: '', months: '' });
      setPhoto(null);
      setPreviewPhoto('');

      alert('Consultant added successfully!');
    } catch (error) {
      console.error('Error adding consultant: ', error);
      alert('Failed to add consultant.');
    }
  };

  return (
    <Wrapper>
      <Form onSubmit={handleSubmit}>
        <Heading>Enter The Consultant Details</Heading>
        <PrimaryDetailsContainer>
          <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Label>Photo:</Label>
            <Input type="file" onChange={handlePhotoChange} accept="image/*" required />
            {previewPhoto && <ImgPreview src={previewPhoto} alt="Consultant Preview" />}
          </div>
          <div style={{ flex: 1 }}>
            <Label>Name:</Label>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            <Label>Email:</Label>
            <Input type="email" value={contact} onChange={(e) => setContact(e.target.value)} required />
            <Label>Phone Number:</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
        </PrimaryDetailsContainer>
        <SecondaryDetailsContainer>
          <div style={{ flex: 1 }}>
            <Label>Specialty:</Label>
            <Select value={specialty} onChange={(e) => setSpecialty(e.target.value)} required>
              <option value="">Select Specialty</option>
              <option value="Orthodontist">Orthodontist</option>
              <option value="Periodontist">Periodontist</option>
              <option value="Endodontist">Endodontist</option>
              <option value="Prosthodontist">Prosthodontist</option>
              <option value="Oral Surgeon">Oral Surgeon</option>
              <option value="Pediatric Dentist">Pediatric Dentist</option>
              <option value="Cosmetic Dentist">Cosmetic Dentist</option>
              <option value="General Dentist">General Dentist</option>
            </Select>
          </div>
          <div style={{ flex: 1 }}>
            <Label>Availability:</Label>
            <Select value={availability} onChange={(e) => setAvailability(e.target.value)} required>
              <option value="">Select Availability</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </Select>
          </div>
          <div style={{ flex: 1 }}>
            <Label>Years:</Label>
            <Input
              type="number"
              value={experience.years}
              onChange={(e) => setExperience((prev) => ({ ...prev, years: e.target.value }))}
              min="0"
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Months: </Label>
            <Input
              type="number"
              value={experience.months}
              onChange={(e) => setExperience((prev) => ({ ...prev, months: e.target.value }))}
              min="0"
              max="11"
              required
            />
          </div>
        </SecondaryDetailsContainer>
        <FormGroup>
          <div style={{ flex: 1 }}>
            <Label>Additional Information:</Label>
            <Textarea
              value={AdditionalInformation}
              onChange={(e) => setAdditionalInformation(e.target.value)}
            />
          </div>
        </FormGroup>
        <Button type="submit">Add Consultant</Button>
      </Form>
    </Wrapper>
  );
};

export default AddConsultant;
