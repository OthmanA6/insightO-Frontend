import axios, { type AxiosInstance, AxiosError, type InternalAxiosRequestConfig } from 'axios'


const axiosApi:AxiosInstance = axios.create({ baseURL: import.meta.env.VITE_API_URL||'http://localhost:5000/api',
    headers:{
        'Content-Type':'application/json',
        'Accept':'application/json',
    },
});

    // REQ
    axiosApi.interceptors.request.use((config: InternalAxiosRequestConfig) =>{
        const token = localStorage.getItem("token");
        if(token){
            config.headers.Authorization= `Bearer ${token}`;
        }        
        return config; 
    },
    (error: AxiosError) => {
    return Promise.reject(error);
  }
);

    // res

    axiosApi.interceptors.response.use( (res)=>{
        return res;
    }, (error:AxiosError)=>{
        const url = error.config?.url ?? '';
        const isAuthRoute = /^\/(login|register)/.test(url);
        if(error.response?.status === 401 && !isAuthRoute){
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    });

    export default axiosApi;