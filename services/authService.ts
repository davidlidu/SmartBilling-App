import axios from "axios";

const API_URL = "https://api.facturador.lidutech.net/api/auth";

export const loginRequest = async (username: string, password: string) => {
  return axios.post(`${API_URL}/login`, { username, password });
};

