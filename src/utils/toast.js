import Toast from "react-native-toast-message";

export const showToast = (type, message, options = {}) => {
  Toast.show({
    type,
    text1: message,
    position: "top",
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 60,
    ...options,
  });
};

export const showSuccessToast = (message, options = {}) => {
  showToast("success", message, options);
};

export const showErrorToast = (message, options = {}) => {
  showToast("error", message, options);
};

export const showInfoToast = (message, options = {}) => {
  showToast("info", message, options);
};

export const hideToast = () => {
  Toast.hide();
};
