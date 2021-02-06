import { Request, Response } from 'express';
import Result from '@auth-model/result';
import Access from '@auth-entity/access';

export function parseAccessToken(request: Request): Result<any> {
  const authHeader = request.headers['authorization'];
  if (authHeader == undefined) return new Result(new Error('Not authorized'), 401);

  const headerToken = authHeader.split(' ');
  if (headerToken.length != 2) return new Result(new Error('Not authorized'), 401);

  const token = headerToken[1];
  const claims = Access.decode(token, Access.idFromName(process.env.ACCESS_TYPE_USER!));
  if (claims == undefined) return new Result(new Error('Not authorized'), 401);
  return new Result(claims, 200);
}
// Gestionar un posible fallo cuando la cookie sea undefined
export function setRefreshTokenCookie(response: Response, token: string) {
  const refreshExpiration = Access.refreshExpiration();
  response.cookie(process.env.REFRESH_TOKEN_NAME!, token, {
    domain: process.env.REFRESH_TOKEN_DOMAIN!,
    secure: process.env.REFRESH_TOKEN_SECURE! == 'true',
    httpOnly: process.env.REFRESH_TOKEN_HTTPONLY! == 'true',
    expires: refreshExpiration,
    maxAge: refreshExpiration.getTime()
  });
}
