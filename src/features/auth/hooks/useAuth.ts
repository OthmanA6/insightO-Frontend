import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  logout,
  clearError,
  setPendingOtpState,
  clearPendingOtpState,
} from "../store/authSlice";
import { loginUser as loginThunk } from "../store/authSlice";
import type { LoginPayload } from "../types";

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const {
    user,
    token,
    isLoading,
    isError,
    errorMessage,
    pendingEmail,
    otpFlowType,
  } = useAppSelector((state) => state.auth);

  const login = async (credentials: LoginPayload) => {
    return await dispatch(loginThunk(credentials));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    dispatch(logout());
    window.location.href = "/login";
  };

  const resetError = () => {
    dispatch(clearError());
  };

  return {
    user,
    token,
    isLoading,
    isError,
    errorMessage,
    pendingEmail,
    otpFlowType,
    isAuthenticated: !!token,
    login,
    logout: handleLogout,
    clearError: resetError,
    setPendingOtpState: (payload: {
      email: string;
      flowType: "register" | "reset";
    }) => dispatch(setPendingOtpState(payload)),
    clearPendingOtpState: () => dispatch(clearPendingOtpState()),
  };
};
