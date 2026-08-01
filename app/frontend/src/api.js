import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const fetchPackages = async () => {
  try {
    const res = await axios.get(`${API}/packages`);
    return res.data;
  } catch (err) {
    console.error("Failed to fetch packages", err);
    return [];
  }
};

export const fetchPackageDetail = async (id) => {
  const res = await axios.get(`${API}/packages/${id}`);
  return res.data;
};

export const fetchMenu = async () => {
  try {
    const res = await axios.get(`${API}/menu`);
    return res.data;
  } catch (err) {
    console.error("Failed to fetch menu", err);
    return [];
  }
};

export const adminLogin = async (email, password) => {
  const res = await axios.post(`${API}/admin/login`, { email, password });
  return res.data;
};

export const updatePackage = async (id, data, token) => {
  const res = await axios.put(`${API}/admin/packages/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const createPackage = async (data, token) => {
  const res = await axios.post(`${API}/admin/packages`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deletePackage = async (id, token) => {
  const res = await axios.delete(`${API}/admin/packages/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const createMenuItem = async (data, token) => {
  const res = await axios.post(`${API}/admin/menu`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateMenuItem = async (id, data, token) => {
  const res = await axios.put(`${API}/admin/menu/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deleteMenuItem = async (id, token) => {
  const res = await axios.delete(`${API}/admin/menu/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const sendOTP = async (phone) => {
  const res = await axios.post(`${API}/auth/send-otp`, { phone });
  return res.data;
};

export const verifyOTP = async (phone, otp) => {
  const res = await axios.post(`${API}/auth/verify-otp`, { phone, otp });
  return res.data;
};

export const submitApplication = async (data) => {
  const res = await axios.post(`${API}/applications`, data);
  return res.data;
};

export const fetchApplications = async (token) => {
  const res = await axios.get(`${API}/admin/applications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};
