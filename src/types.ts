import { Magic, Claim } from '@magic-sdk/admin';
import { Request } from 'express';

export interface StrategyOptionsWithReq {
  magicInstance?: Magic;
  passReqToCallback?: true;
}

export interface StrategyOptions {
  magicInstance?: Magic;
  passReqToCallback?: false;
}

export interface MagicUser {
  id: string;
  publicAddress: string;
  claim: Claim;
}

export interface DoneFuncInfo {
  message: string;
}

export interface DoneFunc {
  (error: any, user?: any, info?: DoneFuncInfo): void;
}

export interface VerifyFuncWithReq {
  (req: Request, user: MagicUser, done: DoneFunc): void;
}

export interface VerifyFunc {
  (user: MagicUser, done: DoneFunc): void;
}
