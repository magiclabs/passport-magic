/*
  eslint-disable

  no-template-curly-in-string,
  no-multi-assign,
  prefer-rest-params
 */

import { Strategy as BaseStrategy } from 'passport-strategy';
import { Magic, SDKError as MagicSDKError } from '@magic-sdk/admin';
import { Request } from 'express';
import { VerifyFunc, VerifyFuncWithReq, StrategyOptions, StrategyOptionsWithReq, MagicUser, DoneFunc } from './types';

export class Strategy extends BaseStrategy {
  public readonly name = 'magic';
  private readonly verify: VerifyFunc;
  private readonly verifyWithReq: VerifyFuncWithReq;
  private readonly passReqToCallback: boolean;
  private readonly attachmentAttribute: string;
  private readonly magicInstance: Magic;

  /**
   * Creates an instance of `MagicStrategy`.
   *
   * This authentication strategy validates requests based on an authorization
   * header containing a Decentralized ID Token (DIDT).
   *
   * Applications must supply a `verify` callback which accepts a `MagicUser`
   * object with the following information:
   *
   *   1. `claim`: The validated and parsed DIDT claim.
   *   2. `id`: The user's Decentralized Identfier. This should be used as the
   *      ID column in your user tables.
   *   3. `publicAddress`: The public address of the signing user. DIDTs are
   *      generated using Elliptic Curve public/private key pairs.
   *
   * The `verify` callback also supplies a `done` callback, which should be
   * called with the user's resolved profile information or set to `false` if
   * the credentials are not valid (i.e.: due to a replay attack).
   *
   * If an exception occurred, `err` should be set.
   *
   * An `options` object can be passed to the constructor to customize behavior of the `verify` callback:
   *
   * Options:
   *   - `magicInstance`: A custom Magic SDK instance to use.
   *   - `passReqToCallback`: When `true`, `req` is the first argument to the verify callback (default: `false`).
   *
   * **NOTE: Parameters can be provided in any order!**
   *
   * @param options - Options to customize the functionality of `verify`.
   * @param verify - A callback to validate the authentication request.
   *
   * @see https://docs.magic.link/tutorials/decentralized-id
   * @see https://w3c-ccg.github.io/did-primer/
   *
   * @example
   *     passport.use(new MagicStrategy(
   *       ({ id }, done) => {
   *         try {
   *           const user = await User.findOne(id);
   *           done(null, user);
   *         } catch (err) {
   *           done(err);
   *         }
   *       }
   *     ));
   */
  /* eslint-disable prettier/prettier */
  constructor(options: StrategyOptions,         verify:  VerifyFunc);
  constructor(options: StrategyOptionsWithReq,  verify:  VerifyFuncWithReq);
  constructor(verify:  VerifyFunc,              options: StrategyOptions);
  constructor(verify:  VerifyFuncWithReq,       options: StrategyOptionsWithReq);
  constructor(verify:  VerifyFunc);
  /* eslint-enable prettier/prettier */
  constructor(
    arg0: VerifyFunc | VerifyFuncWithReq | StrategyOptions | StrategyOptionsWithReq,
    arg1?: VerifyFunc | VerifyFuncWithReq | StrategyOptions | StrategyOptionsWithReq,
  ) {
    super();

    // Extract options from arguments -- parameters can be provided in any order.
    const args = Array.from(arguments);
    const verify = args.find(arg => typeof arg === 'function') as VerifyFunc | VerifyFuncWithReq;
    const options = args.find(arg => typeof arg !== 'function') as StrategyOptions | StrategyOptionsWithReq | undefined;

    if (!verify) throw new TypeError('`MagicStrategy` requires a `verify` callback.');

    this.verify = this.verifyWithReq = verify as any;
    this.passReqToCallback = !!options?.passReqToCallback;
    this.attachmentAttribute = options?.attachmentAttribute ?? 'attachment';
    this.magicInstance = options?.magicInstance || new Magic();
  }

  /**
   * Authenticate request based on the authorization header.
   *
   * @param req - A request object from Express.
   */
  public async authenticate(req: Request) {
    const hasAuthorizationHeader = !!req.headers.authorization;
    const isFormattedCorrectly = req.headers.authorization?.toLowerCase().startsWith('bearer ');

    if (!hasAuthorizationHeader) return this.fail({ message: 'Missing authorization header.' }, 400);
    if (!isFormattedCorrectly) {
      return this.fail({ message: 'Malformed authorization header. Please use the `Bearer ${token}` format.' }, 400);
    }

    const didToken = req.headers.authorization!.substring(7);
    const attachment = (req as any)[this.attachmentAttribute] ?? 'none';

    try {
      this.magicInstance.token.validate(didToken, attachment);
      const user: MagicUser = {
        issuer: this.magicInstance.token.getIssuer(didToken),
        publicAddress: this.magicInstance.token.getPublicAddress(didToken),
        claim: this.magicInstance.token.decode(didToken)[1],
      };

      const done: DoneFunc = (_err, _user, _info: any) => {
        if (_err) return this.error(_err);
        if (!_user) return this.fail(_info);
        this.success(_user, _info);
      };

      try {
        if (this.passReqToCallback) this.verifyWithReq(req, user, done);
        else this.verify(user, done);
      } catch (err) {
        return this.error(err);
      }
    } catch (err) {
      if (err instanceof MagicSDKError) return this.fail({ message: err.message, error_code: err.code }, 401);
      return this.fail({ message: 'Invalid DID token.' }, 401);
    }
  }
}
