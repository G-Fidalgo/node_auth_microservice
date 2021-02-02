import { sign, verify } from 'jsonwebtoken';

/**
 * Define all the action we are going to allow in our system
 *  userAccess: Allows to the user to access everything that belong to him
 *  refreshAccess: Allows the user to refresh their token
 *  confirmUser: Allows the user to confirm their email
 */
export const JWTActionType = {
  userAccess: 0,
  refreshAccess: 1,
  confirmUser: 2
};

class JWTAction {
  type?: number;
  expiresIn?: string;
  secret?: string;

  constructor(type: number) {
    const types = ['userAccess', 'refreshAcces', 'confirmUser'];

    if (type < 0 || type >= 3) {
      this.type = undefined;
      return;
    }

    this.type = type;
    switch (type) {
      case 1:
        this.expiresIn = process.env.REFRESH_TOKEN_EXPIRATION_DAYS + 'd';
        this.secret = process.env.REFRESH_TOKEN_SECRET;
      default:
        this.expiresIn = process.env.ACCESS_TOKEN_EXPIRATION_MINUTES + 'm';
        this.secret = process.env.ACCESS_TOKEN_SECRET;
    }
  }

  invalid() {
    return this.type == undefined || this.expiresIn == undefined || this.secret == undefined;
  }
}

export class JWT {
  static encode(ukey: string, refreshIndex: number, actionType: number): string | undefined {
    const action = new JWTAction(actionType);

    if (action.invalid()) return undefined;

    try {
      const claims = {
        iss: process.env.JWT_ISSUER,
        uky: ukey,
        act: action.type,
        rti: refreshIndex
      };

      const token = sign(claims, action.secret!, { expiresIn: action.expiresIn });
      return token;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }

  static decode(token: string, actionType: number): any | undefined {
    const action = new JWTAction(actionType);

    if (action.invalid()) return undefined;

    try {
      const claims = verify(token, action.secret!);
      return claims;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }

  static refreshExpiration() {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(process.env.REFRESH_TOKEN_EXPIRATION_DAYS!));
    return d;
  }
}
