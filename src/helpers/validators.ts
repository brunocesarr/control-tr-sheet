import { jwtDecode } from 'jwt-decode';

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

const validatePassword = (password: string) => {
  return String(password).match(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,16}$/
  );
};

const validateName = (name: string) => {
  return String(name).match(/^[a-zA-Z ]{2,30}$/);
};

const isTokenExpired = (token?: string) => {
  if (!token) return true;
  try {
    const decodedToken = jwtDecode(token);
    if (!decodedToken.exp) return true;
    const currentTime = Date.now() / 1000;
    return decodedToken.exp < currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

const isAdminToken = (token?: string) => {
  if (!token) return true;
  try {
    const decodedToken: any = jwtDecode(token);
    if (!decodedToken.isAdmin) return false;
    return decodedToken.isAdmin.toLowerCase() === 'true';
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

export { validateEmail, validateName, validatePassword, isTokenExpired, isAdminToken };
