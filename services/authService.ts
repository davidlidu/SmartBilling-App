import axios from "axios";

const API_URL = "https://api.facturador.lidutech.net/api/auth";

export const loginRequest = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/login`, {
    email,
    password,
  });

  return response.data; // token + user
};
