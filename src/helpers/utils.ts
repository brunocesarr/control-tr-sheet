import { Models } from 'appwrite';
import jwt from 'jwt-simple';

const secret = process.env.JWT_SECRET ?? '';

const generateJWT = (userInfo: Models.User<Models.Preferences>, sessionId: string) => {
  return jwt.encode(
    {
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      userId: userInfo.$id,
      sessionId,
      isAdmin: userInfo.labels.includes('admin') ?? false,
    },
    secret
  );
};

export { generateJWT };
