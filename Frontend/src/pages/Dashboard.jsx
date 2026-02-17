import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import api from './Apiinterceptor'
import { useAuth } from '../context/AuthContext'
const Dashboard = () => {
  const [content,setContent]=useState("")
  const { serverUrl } = useAuth();
  async function fetchAdminData() {
    try{
const {data}=await api.get(`${serverUrl}/api/user/admin`,{
  withCredentials:true
})

setContent(data.message)
    }
    catch(error){
toast.error(
  error.response?.data?.message || "Access denied"
);
    }
  }


useEffect(() => {
  if (serverUrl) {
    fetchAdminData();
  }
}, [serverUrl]);

  return (
    <div>
    {content && <div>{content}</div>}
    </div>
  )
}

export default Dashboard
