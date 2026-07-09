import React, { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { InputField } from '../../components/InputField/InputField';
import { StepIndicator } from '../../components/StepIndicator/StepIndicator';

import './CompleteProfilePage.css';

import { api } from '../../data/api';

const getLocalTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};



const healthGoals = ['Weight Loss', 'Muscle Gain', 'Better Energy', 'Heart Health', 'Diabetes Management', 'General Wellness', 'Sports Performance', 'Stress Management', 'Better Sleep', 'Digestive Health'];

export interface CompleteProfilePageProps {
  role: 'client' | 'coach';
  onComplete: (name?: string, goal?: string, data?: any) => void;
  onNavigate?: (page: string) => void;
  profileData?: any;
}
export const CompleteProfilePage: React.FC<CompleteProfilePageProps> = ({ role, onComplete, onNavigate, profileData }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [fullName, setFullName] = useState(profileData?.name || '');
  const [emailAddress, setEmailAddress] = useState(profileData?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(profileData?.phone || '');
  const [city, setCity] = useState(profileData?.city || '');
  const [age, setAge] = useState(profileData?.age || '');
  const [gender, setGender] = useState(profileData?.gender || '');
  const [coachName, setCoachName] = useState(profileData?.coachName || '');
  const [isAssessmentExpanded, setIsAssessmentExpanded] = useState(false);
  const [error, setError] = useState('');
  
  // Advanced Body Metrics
  const [bodyWeight, setBodyWeight] = useState('');
  const [bodyMassIndex, setBodyMassIndex] = useState('');
  const [bodyFatRatio, setBodyFatRatio] = useState('');
  const [muscleRate, setMuscleRate] = useState('');
  const [bodyWater, setBodyWater] = useState('');
  const [boneMass, setBoneMass] = useState('');
  const [basalMetabolicRate, setBasalMetabolicRate] = useState('');
  const [metabolicAge, setMetabolicAge] = useState('');
  const [visceralFat, setVisceralFat] = useState('');
  const [subcutaneousFat, setSubcutaneousFat] = useState('');
  const [proteinMass, setProteinMass] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [weightWithoutFat, setWeightWithoutFat] = useState('');
  const [belly, setBelly] = useState('');
  const [waist, setWaist] = useState('');
  const [thigh, setThigh] = useState('');
  const [chest, setChest] = useState('');
  const [arm, setArm] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [height, setHeight] = useState(profileData?.height || '');
  const [weight, setWeight] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [activeGoal, setActiveGoal] = useState(profileData?.activeGoal || '');
  const [medicalPdf, setMedicalPdf] = useState<File | null>(null);
  const [allergies, setAllergies] = useState(profileData?.allergies || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveProfile = async () => {
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    try {
      if (role === 'client') {
        const formData = new FormData();
        formData.append('fullName', fullName);
        formData.append('emailAddress', emailAddress);
        formData.append('phoneNumber', phoneNumber);
        formData.append('city', city);
        formData.append('age', age);
        formData.append('gender', gender);
        formData.append('height', height || '');
        formData.append('heightUnit', heightUnit);
        formData.append('weightUnit', weightUnit);
        formData.append('activeGoal', activeGoal);
        formData.append('allergies', allergies);
        formData.append('coachName', coachName);

        // Body parameters
        formData.append('bodyWeight', bodyWeight || weight || '');
        formData.append('bodyMassIndex', bodyMassIndex);
        formData.append('bodyFatRatio', bodyFatRatio);
        formData.append('muscleRate', muscleRate);
        formData.append('bodyWater', bodyWater);
        formData.append('boneMass', boneMass);
        formData.append('basalMetabolicRate', basalMetabolicRate);
        formData.append('metabolicAge', metabolicAge);
        formData.append('visceralFat', visceralFat);
        formData.append('subcutaneousFat', subcutaneousFat);
        formData.append('proteinMass', proteinMass);
        formData.append('muscleMass', muscleMass);
        formData.append('weightWithoutFat', weightWithoutFat);

        // Body Measurements
        formData.append('belly', belly);
        formData.append('waist', waist);
        formData.append('thigh', thigh);
        formData.append('chest', chest);
        formData.append('arm', arm);

        if (medicalPdf) {
          formData.append('medicalPdf', medicalPdf);
        }

        const res = await api.completeProfile(formData);
        if (res.success) {
          onComplete(fullName, activeGoal, res.data);
        }
      } else {
        // Coach profile complete is handled similarly, or just setting basic info
        // Wait, coach doesn't have a specific edit profile screen in requirements,
        // so we just trigger completion locally or call a placeholder
        onComplete(fullName, activeGoal, {});
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="complete-profile-page page-enter">
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#fee2e2',
          color: '#ef4444',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          zIndex: 1000,
          fontSize: '0.9rem',
          borderLeft: '4px solid #ef4444'
        }}>
          ⚠️ {error}
        </div>
      )}
      <div className="complete-profile-topbar" style={{ display: 'flex', alignItems: 'center', padding: '1rem 2rem', gap: '1.5rem' }}>
        <button 
          onClick={() => onNavigate && onNavigate(role === 'coach' ? 'coach-dashboard' : 'client-dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: 'var(--grey-500)', transition: 'background-color 0.2s', margin: 0 }}
          title="Back to Dashboard"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--grey-100)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          ←
        </button>
        <div className="complete-profile-logo" style={{ margin: 0 }}><span className="logo-icon">🌿</span><span className="logo-text">NutriCoach</span></div>
        <div className="complete-profile-top-right" style={{ marginLeft: 'auto' }}><span className="step-counter">Step {currentStep} of 4</span></div>
      </div>
      <div className="complete-profile-content">
        <StepIndicator totalSteps={4} currentStep={currentStep} stepLabels={['Personal Details', 'Body Parameters', 'Medical Records', 'Coach Details']} />
        <div className="complete-profile-card">
          {currentStep === 1 && (
            <div className="step-content">
              <h2>Personal Information</h2>
              <p className="step-subtitle">Tell us about yourself.</p>
              <InputField label="Full Name" type="text" placeholder="" value={fullName} onChange={setFullName} required />
              <InputField label="Email Address" type="email" placeholder="" value={emailAddress} onChange={setEmailAddress} required />
              <InputField label="Phone Number" type="text" placeholder="" value={phoneNumber} onChange={setPhoneNumber} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}><InputField label="City" type="text" placeholder="" value={city} onChange={setCity} /></div>
                <div style={{ flex: 1 }}><InputField label="Age" type="number" placeholder="" value={age} onChange={setAge} /></div>
              </div>
              <div className="gender-selector" style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Gender</label>
                <div className="gender-options" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button className={`gender-option ${gender === 'Male' ? 'selected' : ''}`} onClick={() => setGender('Male')} style={{ flex: 1, padding: '0.5rem', border: '1.5px solid var(--grey-200)', borderRadius: 'var(--radius-full)', background: gender === 'Male' ? 'var(--dark)' : 'var(--white)', color: gender === 'Male' ? 'var(--white)' : 'inherit', cursor: 'pointer', textAlign: 'center' }}>Male</button>
                  <button className={`gender-option ${gender === 'Female' ? 'selected' : ''}`} onClick={() => setGender('Female')} style={{ flex: 1, padding: '0.5rem', border: '1.5px solid var(--grey-200)', borderRadius: 'var(--radius-full)', background: gender === 'Female' ? 'var(--dark)' : 'var(--white)', color: gender === 'Female' ? 'var(--white)' : 'inherit', cursor: 'pointer', textAlign: 'center' }}>Female</button>
                </div>
              </div>
              <Button variant="primary" fullWidth onClick={() => setCurrentStep(2)}>Next</Button>
            </div>
          )}
          {currentStep === 2 && (
            <div className="step-content">
              <h2>Body Information</h2>
              <p className="step-subtitle">Current metrics and advanced analysis.</p>
              <div className="metric-row">
                <div className="metric-input-group">
                  <label className="input-label">Height</label>
                  <div className="metric-input-wrapper">
                    <input type="number" className="metric-input" placeholder="" value={height} onChange={(e) => setHeight(e.target.value)} />
                    <div className="unit-toggle">
                      <button className={heightUnit === 'cm' ? 'active' : ''} onClick={() => setHeightUnit('cm')}>cm</button>
                      <button className={heightUnit === 'ft' ? 'active' : ''} onClick={() => setHeightUnit('ft')}>ft</button>
                    </div>
                  </div>
                </div>
              </div>


              <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <InputField label="Body Weight" type="number" value={bodyWeight} onChange={setBodyWeight} />
                <InputField label="Body Mass Index" type="number" value={bodyMassIndex} onChange={setBodyMassIndex} />
                <InputField label="Body Fat Ratio" type="number" value={bodyFatRatio} onChange={setBodyFatRatio} />
                <InputField label="Muscle Rate" type="number" value={muscleRate} onChange={setMuscleRate} />
                <InputField label="Body Water" type="number" value={bodyWater} onChange={setBodyWater} />
                <InputField label="Bone Mass" type="number" value={boneMass} onChange={setBoneMass} />
                <InputField label="Basal Metabolic Rate" type="number" value={basalMetabolicRate} onChange={setBasalMetabolicRate} />
                <InputField label="Metabolic Age" type="number" value={metabolicAge} onChange={setMetabolicAge} />
                <InputField label="Visceral Fat" type="number" value={visceralFat} onChange={setVisceralFat} />
                <InputField label="Subcutaneous Fat" type="number" value={subcutaneousFat} onChange={setSubcutaneousFat} />
                <InputField label="Protein Mass" type="number" value={proteinMass} onChange={setProteinMass} />
                <InputField label="Muscle Mass" type="number" value={muscleMass} onChange={setMuscleMass} />
                <InputField label="Weight Without Fat" type="number" value={weightWithoutFat} onChange={setWeightWithoutFat} />
              </div>

              <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: 'var(--dark)', fontSize: '1.1rem', fontWeight: 700 }}>Body Measurements</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <InputField label="Belly" type="number" value={belly} onChange={setBelly} />
                <InputField label="Waist" type="number" value={waist} onChange={setWaist} />
                <InputField label="Thigh" type="number" value={thigh} onChange={setThigh} />
                <InputField label="Chest" type="number" value={chest} onChange={setChest} />
                <InputField label="Arm" type="number" value={arm} onChange={setArm} />
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <InputField label="Active Goal" type="text" placeholder="e.g., Weight Loss" value={activeGoal} onChange={setActiveGoal} />
              </div>

              <div className="step-navigation" style={{ marginTop: '2rem' }}>
                <Button variant="ghost" onClick={() => setCurrentStep(1)}>Previous</Button>
                <Button variant="primary" onClick={() => setCurrentStep(3)}>Next</Button>
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="step-content">
              <h2>Medical Records</h2>
              <p className="step-subtitle">Upload your medical history securely.</p>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Medical Record PDF</label>
                <div style={{ marginTop: '0.5rem' }}>
                  <input 
                    type="file" 
                    id="medical-pdf-upload"
                    accept=".pdf" 
                    style={{ display: 'none' }}
                    onChange={(e) => setMedicalPdf(e.target.files ? e.target.files[0] : null)} 
                  />
                  <label 
                    htmlFor="medical-pdf-upload"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px', height: '48px', backgroundColor: 'var(--grey-100)', color: 'var(--dark)', borderRadius: '12px', cursor: 'pointer', fontWeight: 500, transition: 'background-color 0.2s', border: '1px solid var(--grey-200)', justifyContent: 'center' }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📄</span> Upload Medical Record
                  </label>
                  {medicalPdf && <p style={{ color: 'var(--green)', marginTop: '0.75rem', fontSize: '0.85rem', textAlign: 'center', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Attached: {medicalPdf.name}</p>}
                </div>
              </div>

              <InputField label="Allergies (Optional)" type="text" placeholder="e.g., Peanuts, Lactose" value={allergies} onChange={setAllergies} />

              <div className="step-navigation" style={{ marginTop: '2rem' }}>
                <Button variant="ghost" onClick={() => setCurrentStep(2)}>Previous</Button>
                <Button variant="primary" onClick={() => setCurrentStep(4)}>Next</Button>
              </div>
            </div>
          )}
          {currentStep === 4 && (
            <div className="step-content">
              <h2>Coach Details</h2>
              <p className="step-subtitle">Enter your coach's information.</p>
              <InputField label="Coach Name" type="text" placeholder="" value={coachName} onChange={setCoachName} />

              <div className="step-navigation" style={{ marginTop: '2rem' }}>
                <Button variant="ghost" onClick={() => setCurrentStep(3)}>Previous</Button>
                <Button variant="green" onClick={handleSaveProfile} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
