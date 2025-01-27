'use client'

import {
    Button,
    Box
} from '@mui/material'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import { EducationManagement } from './profile/education'

import { AddProfilePic } from './profile/profilepic'
import { AddCv } from './profile/addCv'
import WorkshopConferenceManagement from './profile/workshops-conferences'
import InstituteActivityManagement from './profile/institute-activities'
import DepartmentActivityManagement from './profile/department-activities'
import InternshipManagement from './profile/internships'
import TeachingEngagementManagement from './profile/teaching-engagement'
import ProjectSupervisionManagement from './profile/project-supervision'
import TextbookManagement from './profile/textbooks'
import EditedBookManagement from './profile/edited-books'
import BookChapterManagement from './profile/book-chapters'
import SponsoredProjectManagement from './profile/sponsored-projects'
import ConsultancyProjectManagement from './profile/consultancy-projects'
import IPRManagement from './profile/ipr'
import StartupManagement from './profile/startups'
import MembershipManagement from './profile/memberships.js'
import PatentManagement from './profile/patents.js'
import PhdCandidateManagement from './profile/phd-candidates.js'
import JournalPaperManagement from './profile/journal-papers.js'
import ConferencePaperManagement from './profile/conference-papers.js'
import Loading from './loading'
import { EditProfile } from './profile/edit-profile'

const Profile = styled.div`
    font-family: 'Source Sans Pro';
    margin-top: 3vw;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-evenly;
    .faculty-img-row {
        margin-top: 5vh;
        justify-content: center;
        text-align: center;
        .facmail {
            position: absolute;
            margin-top: -70px;
            margin-left: 60px;
        }
        h3 {
            color: #4e4e4e;
        }
        font-family: 'Source Sans Pro';
        .faculty-img-wrap {
            overflow: hidden;
            width: 250px;
            height: 250px;
            min-width: 250px;
            border-radius: 50%;

            img {
                width: 100%;
                height: auto;
                align-self: center;
            }
        }
    }
    .faculty-details-row {
        width: 80%;
        display: flex;
        justify-content: center;
        flex-direction: column;
        #dir {
            line-height: 1.5;
            letter-spacing: 1px;
            padding-right: 3vw;
            padding-top: 50px;
        }
        .fac-card {
            width: 90%;
            margin-top: 3vh;
            margin-bottom: 3vh;
            background: #ffffff;
            box-shadow: 0px 0px 18px rgba(156, 156, 156, 0.38);
            border-radius: 5px;
            padding-left: 5%;
            padding-bottom: 15px;
            font-family: 'Source Sans Pro';
            list-style: disc;

            h3 {
                color: #2f2f2f;
            }
            .factable {
                overflow: hidden;
                max-width: 90%;
                overflow-x: scroll;
                scrollbar-width: none;
                -ms-overflow-style: none;
            }
            .factable:-webkit-scrollbar {
                width: 0px;
                background: transparent;
            }
            table {
                min-width: 90%;
                width: 90%;
            }
        }
    }

    .cv {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.7);
        transition: opacity 500ms;
        visibility: hidden;
        opacity: 0;
    }
    .cv:target {
        visibility: visible;
        opacity: 1;
        z-index: 1;
    }

    .popup {
        margin: 70px auto;
        padding: 20px;
        background: #fff;
        border-radius: 5px;
        width: 30%;
        position: relative;
        transition: all 5s ease-in-out;
        min-height: 70vh;
        min-width: 70vw;
    }

    .popup .close {
        position: absolute;
        top: 20px;
        right: 30px;
        transition: all 200ms;
        font-size: 30px;
        font-weight: bold;
        text-decoration: none;
        color: #333;
    }
    .popup .close:hover {
        color: #06d85f;
    }
    .popup .content {
        height: 70vh;
        width: 70vw;
        overflow: hidden;
    }
`

export default function Profilepage({ details }) {
    const { data: session, status } = useSession()
    const [detail, setDetails] = useState(details)
    const [loading, setLoading] = useState(false)
    const [openModals, setOpenModals] = useState({
        education: false,
        work: false,
        journalPaper: false,
        conferencePaper: false,
        textbook: false,
        editedBook: false,
        bookChapter: false,
        sponsoredProject: false,
        consultancyProject: false,
        ipr: false,
        startup: false,
        internship: false,
        workshopConference: false,
        instituteActivity: false,
        departmentActivity: false,
        teachingEngagement: false,
        projectSupervision: false,
        profilePic: false,
        cv: false,
        editProfile: false,
        // ... other modal states
    })

    // Update state after refreshing data
    useEffect(() => {
        if (details) {
            setDetails(details)
        }
    }, [details])

    const handleModalOpen = (modalName) => {
        setOpenModals(prev => ({
            ...prev,
            [modalName]: true
        }))
    }

    const handleModalClose = (modalName) => {
        setOpenModals(prev => ({
            ...prev,
            [modalName]: false
        }))
    }

    if (status === "loading") return <Loading />
    if (!session) return null

    return (
                <Profile>
            {/* Profile Image Section */}
                    <div className="faculty-img-row">
                        <div className="faculty-img-wrap">
                            <img
                        src={detail?.profile?.image || '/faculty.png'}
                                alt="faculty"
                                style={{ 
                                    width: '200px', 
                                    height: '200px',
                                    objectFit: 'cover',
                                    borderRadius: '50%'
                                }}
                                onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = '/faculty.png'
                                }}
                            />
                        </div>
                <h2>{detail?.profile?.name}</h2>
                <h3>{detail?.profile?.designation}</h3>

                {/* Profile Image & CV Upload Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Button
                                color="primary"
                                variant="contained"
                        onClick={() => handleModalOpen('profilePic')}
                            >
                                {detail?.profile?.image ? 'Update Photo' : 'Upload Photo'}
                            </Button>
                            <AddProfilePic
                        handleClose={() => handleModalClose('profilePic')}
                        modal={openModals.profilePic}
                            />

                            <Button
                                color="primary"
                                variant="contained"
                        onClick={() => handleModalOpen('cv')}
                        sx={{m: 2 }}
                            >
                        {detail?.profile?.cv ? 'Update CV' : 'Upload CV'}
                            </Button>
                            <AddCv
                        handleClose={() => handleModalClose('cv')}
                        modal={openModals.cv}
                    />
                                            </div>
                                        </div>
                                        
            
            <div className="faculty-details-row">
            <div className="fac-card">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <div>
                            <h2 style={{marginTop: '10px'}}>Profile Details</h2>
                            <div style={{ marginTop: '20px' }}>
                                <h4>Research Interest:</h4>
                                <p>{detail?.profile?.research_interest}</p>
                                
                                <h4 style={{marginTop: '10px'}}>Contact:</h4>
                                <p>Email: {detail?.profile?.email}</p>
                                <p>Phone: {detail?.profile?.ext_no}</p>
                                
                                <h4 style={{marginTop: '10px'}}>Social Media & Academic Links:</h4>
                                {detail?.profile?.linkedin && (
                                    <p>LinkedIn: <a href={detail.profile.linkedin} target="_blank" rel="noopener noreferrer">{detail.profile.linkedin}</a></p>
                                )}
                                {detail?.profile?.google_scholar && (
                                    <p>Google Scholar: <a href={detail.profile.google_scholar} target="_blank" rel="noopener noreferrer">View Profile</a></p>
                                )}
                                {detail?.profile?.personal_webpage && (
                                    <p>Personal Webpage: <a href={detail.profile.personal_webpage} target="_blank" rel="noopener noreferrer">Visit Website</a></p>
                                )}
                                {detail?.profile?.scopus && (
                                    <p>Scopus: <a href={detail.profile.scopus} target="_blank" rel="noopener noreferrer">View Profile</a></p>
                                )}
                                {detail?.profile?.vidwan && (
                                    <p>Vidwan: <a href={detail.profile.vidwan} target="_blank" rel="noopener noreferrer">View Profile</a></p>
                                )}
                                {detail?.profile?.orcid && (
                                    <p>ORCID: <a href={detail.profile.orcid} target="_blank" rel="noopener noreferrer">{detail.profile.orcid}</a></p>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="contained"
                            onClick={() => handleModalOpen('editProfile')}
                            sx={{ m: 2 }}
                        >
                            + Edit Details
                        </Button>
                    </Box>
                    <EditProfile
                        handleClose={() => handleModalClose('editProfile')}
                        modal={openModals.editProfile}
                        currentProfile={detail?.profile}
                    />
                </div>


                <div className="fac-card">
                    <EducationManagement />
                                    </div>
                                    <div className="fac-card">
                <TeachingEngagementManagement/>
                            </div>
                            <div className="fac-card">
                <MembershipManagement/>
                        </div>
                        <div className="fac-card">
                <PhdCandidateManagement/>
                        </div>
                        <div className="fac-card">
                <ProjectSupervisionManagement/>
                        </div>
                        <div className="fac-card">
                <SponsoredProjectManagement/>
                        </div>
                        <div className="fac-card">
                <ConsultancyProjectManagement/>
                            </div>
                            <div className="fac-card">
                    <InternshipManagement/>
                        </div>
                        <div className="fac-card">
                <StartupManagement/>
                            </div>
                        <div className="fac-card">
                <IPRManagement/>
                        </div>
                        <div className="fac-card">
                <PatentManagement/>
                            </div>
                            <div className="fac-card">
                <JournalPaperManagement/>
                            </div>
                            <div className="fac-card">
                <ConferencePaperManagement/>
                        </div>
                        <div className="fac-card">
                <BookChapterManagement/>
                            </div>
                            <div className="fac-card">
                <TextbookManagement/>
                            </div>
                            <div className="fac-card">
                <EditedBookManagement/>
                        </div>
                <div className="fac-card">
                    <WorkshopConferenceManagement/>
                                </div>
               
                                <div className="fac-card">
                    <InstituteActivityManagement/>
                        </div>
                <div className="fac-card">
                    <DepartmentActivityManagement/>
                    </div>
                
                
              
                
               
                
               
                
               
               
              
               
               
                



                        </div>

          

                </Profile>
    )
}
