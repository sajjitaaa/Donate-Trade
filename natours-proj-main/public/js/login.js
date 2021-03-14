/*eslint-disable*/
import axios from 'axios';

import { showAlert } from './alert';

export const login = async (email, password) => {
  try {
    const res = await axios.post('/api/v1/users/login', {
      email,
      password,
    });

    if (res.data.status === 'success') {
      //showAlert('success', 'Logged in successful!');
      window.location.replace('/');
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
