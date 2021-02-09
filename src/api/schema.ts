import { buildSchema } from 'graphql';
import User from '@auth-entity/user';
import Access from '@auth-entity/access';
import { handlePasswordChange, handleSendEmailRequest, parseAccessToken, setRefreshTokenCookie } from './helper';

/**
 * Schema for GrapQL
 *  profiel: get info back from the user
 *
 *  Mutations:
 *      register: To register a new user
 *      login: To login an existing user
 *      confirm: To confirm a new registered user
 *
 *  Define Profile: Used on profile query
 *
 *  Define RegisteredUser: Used on register mutation
 *
 *  Define AccessToken: Used on login mutation
 */
export const schema = buildSchema(`
    type Query {
        profile: Profile
        resendConfirmation(email: String!): TmpEmailResponse
        forgotPassword(email: String!): TmpEmailResponse
    }
    type Mutation {
        register(email: String!, password: String!, confirmation: String!): RegisteredUser
        login(email: String!, password: String!): AccessToken
        confirm(email: String!): Boolean
        refresh: AccessToken
        resetPassword(password: String!, confirmation: String!): Boolean
    }

    type Profile {
        ukey: ID
        email: String
    }
    
    type RegisteredUser {
        ukey: ID
        tmp_confirm_token: ID
    }

    type AccessToken {
        ukey: ID
        access_token: ID
    }

    type TmpEmailResponse {
      tmp_email_token: ID
    }
`);

export const root = {
  register: async ({ email, password, confirmation }: { email: string; password: string; confirmation: string }, context: any) => {
    const result = await User.register(email, password, confirmation);
    context.res.status(result.status);

    if (result.isError()) {
      throw result.getError()!;
    }

    const user = result.getObject()!;
    const confirmToken = Access.encode(user.ukey, user.refreshIndex, process.env.ACCESS_TYPE_CONFIRM!);
    if (confirmToken == undefined) {
      context.res.status(500);
      throw new Error('Confirmation failed');
    }
    return { ukey: user.ukey, tmp_confirm_token: confirmToken };
  },

  resendConfirmation: async ({ email }: { email: string }, context: any) => {
    return await handleSendEmailRequest(email, context.res, true, process.env.ACCESS_TYPE_CONFIRM!);
  },

  confirm: async ({ email }: { email: string }, context: any): Promise<boolean> => {
    let result = parseAccessToken(context.req, Access.idFromName(process.env.ACCESS_TYPE_CONFIRM!));
    if (result.isError()) {
      context.res.status(result.status);
      throw result.getError();
    }

    const claims = result.getObject()!;
    if (claims.act != Access.idFromName(process.env.ACCESS_TYPE_CONFIRM!)) {
      context.res.status(401);
      throw new Error('Not authorized');
    }

    const user = await User.getByUserKey(claims.uky, claims.rti);

    if (user == undefined) {
      context.res.status(404);
      throw new Error('User not found');
    }

    if (email != user.email) {
      context.res.status(401);
      throw new Error('Not authorized');
    }

    result = await user.updateConfirmed();
    if (result.isError()) {
      context.res.status(result.status);
      throw result.getError()!;
    }

    context.res.status(201);
    return true;
  },

  login: async ({ email, password }: { email: string; password: string }, context: any) => {
    const result = await User.login(email, password);
    context.res.status(result.status);

    if (result.isError()) throw result.getError()!;

    const user = result.getObject()!;

    const accessToken = Access.encode(user.ukey, user.refreshIndex, process.env.ACCESS_TYPE_USER!);
    const refreshToken = Access.encode(user.ukey, user.refreshIndex, process.env.ACCESS_TYPE_REFRESH!);
    if (accessToken == undefined || refreshToken == undefined) {
      context.res.status(500);
      return new Error('Login failed'), 500;
    }
    context.res.status(result.status);
    setRefreshTokenCookie(context.res, refreshToken);
    return { ukey: user.ukey, access_token: accessToken };
  },

  profile: async ({}: {}, context: any) => {
    const result = parseAccessToken(context.req, Access.idFromName(process.env.ACCESS_TYPE_USER!));
    if (result.isError()) {
      context.res.status(result.status);
      throw result.getError()!;
    }
    const claims = result.getObject()!;
    const user = await User.getByUserKey(claims.uky, claims.rti);

    if (user == undefined) {
      context.res.status(404);
      throw new Error('Invalid user');
    }

    return user;
  },

  refresh: async ({}: {}, context: any) => {
    const token = context.req.cookies[process.env.REFRESH_TOKEN_NAME!];
    context.res.status(401);
    if (token == undefined) throw new Error('Not authorized');

    const claims = Access.decode(token, Access.idFromName(process.env.ACCESS_TYPE_REFRESH!));
    if (claims == undefined) throw new Error('Not authorized');

    const user = await User.getByUserKey(claims.uky, claims.rti);
    if (user == undefined) throw new Error('Not authorized');

    const result = await user.updateRefreshIndex();
    if (result.isError()) {
      context.res.status(result.status);
      throw result.getError()!;
    }
    user.refreshIndex += 1;

    const refreshToken = Access.encode(user.ukey, user.refreshIndex, process.env.ACCESS_TYPE_REFRESH!);
    const accessToken = Access.encode(user.ukey, user.refreshIndex, process.env.ACCESS_TYPE_USER!);
    if (refreshToken == undefined || accessToken == undefined) {
      context.res.status(500);
      throw new Error('Refresh failed');
    }

    setRefreshTokenCookie(context.res, refreshToken);
    context.res.status(200);
    return { ukey: user.ukey, access_token: accessToken };
  },
  forgotPassword: async ({ email }: { email: string }, context: any) => {
    return await handleSendEmailRequest(email, context.res, false, process.env.ACCESS_TYPE_PASSWORD_RESET!);
  },

  resetPassword: async ({ password, confirmation }: { password: string; confirmation: string }, context: any) => {
    const accessId = Access.idFromName(process.env.ACCESS_TYPE_PASSWORD_RESET!);
    return await handlePasswordChange(undefined, password, confirmation, context.req, context.res, accessId);
  }
};
