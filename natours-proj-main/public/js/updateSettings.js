import axios from 'axios';
import { showAlert } from './alert';

export const updateSettings = async (data, type) => {
  try {
    const url = type === 'password' ? 'updatePassword' : 'updateMe';
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/${url}`,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type} updated Successfully!`);
      location.reload();
    }
  } catch (error) {
    console.log(error.response.data.message);
    showAlert('error', error.response.data.message);
  }
};
