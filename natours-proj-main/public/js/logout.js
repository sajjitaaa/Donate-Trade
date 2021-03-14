/*eslint-disable*/
import axios from 'axios';

import { showAlert } from './alert';

export const logout = async () => {
  
  try {
    const res = await axios.get('/api/v1/users/logout');
    
    if (res.data.status === 'success') {
      window.location.replace('http://localhost:3000/login');
      
    }
  } catch (error) {
    showAlert('error', 'Oops! Error logging out.Try again');
  }
};

