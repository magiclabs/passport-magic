/* eslint-disable no-template-curly-in-string */

import test from 'ava';
import sinon from 'sinon';
import { ErrorCode as MagicSDKErrorCode } from '@magic-sdk/admin';
import {
  VALID_DIDT,
  VALID_DIDT_PARSED_CLAIMS,
  EXPIRED_DIDT,
  VALID_DIDT_WITH_ATTACHMENT,
  VALID_DIDT_WITH_ATTACHMENT_PARSED_CLAIMS,
} from '../../lib/constants';
import { createStrategyInstance } from '../../lib/factories';

const invalidReq: any = { headers: { authorization: `Bearer ${EXPIRED_DIDT}` } };

const validReq: any = { headers: { authorization: `Bearer ${VALID_DIDT}` } };
const validUser: any = {
  issuer: VALID_DIDT_PARSED_CLAIMS.iss,
  publicAddress: VALID_DIDT_PARSED_CLAIMS.iss.split(':')[2],
  claim: VALID_DIDT_PARSED_CLAIMS,
};

const validReqWithAttachment: any = {
  headers: { authorization: `Bearer ${VALID_DIDT_WITH_ATTACHMENT}` },
  attachment: 'asdf',
};
const validUserWithAttachment: any = {
  issuer: VALID_DIDT_WITH_ATTACHMENT_PARSED_CLAIMS.iss,
  publicAddress: VALID_DIDT_WITH_ATTACHMENT_PARSED_CLAIMS.iss.split(':')[2],
  claim: VALID_DIDT_WITH_ATTACHMENT_PARSED_CLAIMS,
};

test('#01: Fails with status 400 if authorization header is missing', async t => {
  const { strat, verifyStub, failStub } = createStrategyInstance();

  await strat.authenticate({ headers: { authorization: undefined } } as any);

  t.true(failStub.calledOnceWith({ message: 'Missing authorization header.' }, 400));
  t.true(verifyStub.notCalled);
});

test('#02: Fails with status 400 if authorization header is malformed', async t => {
  const { strat, verifyStub, failStub } = createStrategyInstance();

  await strat.authenticate({ headers: { authorization: `notarealtoken` } } as any);

  t.true(
    failStub.calledOnceWith(
      { message: 'Malformed authorization header. Please use the `Bearer ${token}` format.' },
      400,
    ),
  );
  t.true(verifyStub.notCalled);
});

test('#03: Succeeds validation with a valid DIDT', async t => {
  const { strat, verifyStub, verifyStubWithReq, successStub } = createStrategyInstance();

  await strat.authenticate(validReq);

  t.true(verifyStubWithReq.notCalled);
  t.deepEqual(verifyStub.args[0][0], validUser);
  t.true(successStub.calledOnceWith(validUser, undefined));
});

test('#04: Succeeds validation with a valid DIDT and `passReqToCallback` is `true`', async t => {
  const { strat, verifyStub, verifyStubWithReq, successStub } = createStrategyInstance({ passReqToCallback: true });

  await strat.authenticate(validReq);

  t.true(verifyStub.notCalled);
  t.deepEqual(verifyStubWithReq.args[0][0], validReq);
  t.deepEqual(verifyStubWithReq.args[0][1], validUser);
  t.true(successStub.calledOnceWith(validUser, undefined));
});

test('#05: Handles failure case from user-provided verification function', async t => {
  const { strat, verifyStub, failStub } = createStrategyInstance({ shouldFailVerification: true });

  await strat.authenticate(validReq);

  t.deepEqual(verifyStub.args[0][0], validUser);
  t.true(failStub.calledOnceWith({ message: 'goodbye world' }));
});

test('#06: Uses attachment from `req[attachmentAttribute]`', async t => {
  const { strat, verifyStub, failStub } = createStrategyInstance({ shouldFailVerification: true });

  await strat.authenticate(validReqWithAttachment);

  t.deepEqual(verifyStub.args[0][0], validUserWithAttachment);
  t.true(failStub.calledOnceWith({ message: 'goodbye world' }));
});

test('#07: Handles error case from user-provided verification function', async t => {
  const { strat, verifyStub, errorStub } = createStrategyInstance({ shouldErrorVerification: true });

  await strat.authenticate(validReq);

  t.deepEqual(verifyStub.args[0][0], validUser);
  t.true(errorStub.calledOnceWith({ message: 'hello world' }));
});

test('#08: Handles exception while executing user-provided verification function', async t => {
  const { strat, verifyStub, errorStub } = createStrategyInstance({ shouldThrowVerification: true });

  await strat.authenticate(validReq);

  t.deepEqual(verifyStub.args[0][0], validUser);
  t.is(errorStub.args[0][0].message, 'uh oh!');
});

test('#09: Handles exceptions from Magic Admin SDK during token validation', async t => {
  const { strat, verifyStub, failStub } = createStrategyInstance();

  await strat.authenticate(invalidReq);

  t.true(verifyStub.notCalled);
  t.true(Object.values(MagicSDKErrorCode).includes(failStub.args[0][0].error_code));
  t.is(failStub.args[0][1], 401);
});

test('#10: Handles generic exceptions during token validation', async t => {
  const { strat, verifyStub, failStub } = createStrategyInstance();

  (strat as any).magicInstance.token.validate = sinon.spy(() => {
    throw new Error();
  });
  await strat.authenticate(validReq);

  t.true(verifyStub.notCalled);
  t.true(failStub.calledWith({ message: 'Invalid DID token.' }, 401));
});
