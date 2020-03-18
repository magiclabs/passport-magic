import sinon from 'sinon';
import { Strategy } from '../../src/strategy';

export function createStrategyInstance(
  options: {
    passReqToCallback?: boolean;
    shouldFailVerification?: boolean;
    shouldErrorVerification?: boolean;
    shouldThrowVerification?: boolean;
  } = {} as any,
) {
  const optionsWithDefaults = {
    passReqToCallback: false,
    shouldFailVerification: false,
    shouldErrorVerification: false,
    shouldThrowVerification: false,
    ...options,
  };

  const verifyStub = sinon.spy((user, done) => {
    if (optionsWithDefaults.shouldThrowVerification) throw new Error('uh oh!');

    done(
      optionsWithDefaults.shouldErrorVerification ? { message: 'hello world' } : null,
      optionsWithDefaults.shouldFailVerification ? false : user,
      optionsWithDefaults.shouldFailVerification ? { message: 'goodbye world' } : undefined,
    );
  });

  const verifyStubWithReq = sinon.spy((req, user, done) => {
    if (optionsWithDefaults.shouldThrowVerification) throw new Error('uh oh!');

    done(
      optionsWithDefaults.shouldErrorVerification ? { message: 'hello world' } : null,
      optionsWithDefaults.shouldFailVerification ? false : user,
      optionsWithDefaults.shouldFailVerification ? { message: 'goodbye world' } : undefined,
    );
  });

  const strat = new Strategy(optionsWithDefaults.passReqToCallback ? verifyStubWithReq : verifyStub, {
    passReqToCallback: optionsWithDefaults.passReqToCallback,
  } as any);

  const failStub = sinon.stub();
  const errorStub = sinon.stub();
  const successStub = sinon.stub();

  strat.fail = failStub;
  strat.error = errorStub;
  strat.success = successStub;

  return {
    verifyStub,
    verifyStubWithReq,
    strat,
    failStub,
    errorStub,
    successStub,
  };
}
