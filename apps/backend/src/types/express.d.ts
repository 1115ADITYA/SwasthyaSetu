import { DecodedToken } from './decoded-token';

declare global {
  namespace Express {
    export interface Request {
      user?: DecodedToken;
    }
  }
}
