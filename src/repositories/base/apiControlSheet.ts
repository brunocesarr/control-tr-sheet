import axios, { AxiosRequestConfig } from 'axios';

const URL_BASE_API_SHEET = process.env.NEXT_PUBLIC_URL_AMBIENTE_SERVER;

const defaultOptions: AxiosRequestConfig = {
  baseURL: URL_BASE_API_SHEET,
  headers: {
    'Content-Type': 'application/json',
  },
};
const apiManagerSheet = axios.create(defaultOptions);

export { apiManagerSheet };
