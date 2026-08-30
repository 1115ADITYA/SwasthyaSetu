import { DecodedToken } from '../core/middlewares/auth.middleware';

declare global {
  namespace Express {
    export interface Request {
      user?: DecodedToken;
    }
  }
}
