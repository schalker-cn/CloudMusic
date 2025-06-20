import axios from 'axios';
const instance = axios.create({
  baseURL: 'https://musicapi-git-main-pathyus-projects.vercel.app/',
  method: 'get',
  withCredentials: true,
  
});

instance.interceptors.request.use((config) => {
  return config;
}, err => {
  return Promise.reject(err);
});

instance.interceptors.response.use((data) => {
  return data;
}, err => {
  window.$message.error('network error');
  return Promise.reject(err);
});

export default instance;