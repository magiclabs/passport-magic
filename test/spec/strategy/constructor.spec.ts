import test from 'ava';
import { Strategy as BaseStrategy } from 'passport-strategy';
import { Magic } from '@magic-sdk/admin';
import { Strategy } from '../../../src/strategy';

test('#01: Initialize `MagicStrategy`', t => {
  const verify = () => {};
  const strat = new Strategy(verify);

  t.true(strat instanceof BaseStrategy);
  t.is(strat.name, 'magic');
  t.is((strat as any).verify, verify);
  t.is((strat as any).verifyWithReq, verify);
  t.is((strat as any).attachmentAttribute, 'attachment');
  t.true((strat as any).magicInstance instanceof Magic);
  t.false((strat as any).passReqToCallback);
});

test('#02: Initialize `MagicStrategy` with custom Magic Admin SDK instance', t => {
  const customMagicInst = new Magic('API_KEY');
  const strat = new Strategy({ magicInstance: customMagicInst }, () => {});

  t.is((strat as any).magicInstance, customMagicInst);
});

test('#03: Initialize `MagicStrategy` with custom attachment attribute name', t => {
  const customMagicInst = new Magic('API_KEY');
  const strat = new Strategy({ attachmentAttribute: 'foobar' }, () => {});

  t.is((strat as any).attachmentAttribute, 'foobar');
});

test('#04: Fail to initialize `MagicStrategy` without a `verify` callback', t => {
  // Given `undefined` as only argument.
  t.throws(() => new Strategy(undefined), {
    instanceOf: TypeError,
    message: '`MagicStrategy` requires a `verify` callback.',
  });

  // Given `undefined` as first argument.
  t.throws(() => new Strategy(undefined, {}), {
    instanceOf: TypeError,
    message: '`MagicStrategy` requires a `verify` callback.',
  });

  // Given `undefined` as second argument.
  t.throws(() => new Strategy({}, undefined), {
    instanceOf: TypeError,
    message: '`MagicStrategy` requires a `verify` callback.',
  });
});

test('#05: Arguments can be provided in any order', t => {
  const verify = () => {};
  const options = { passReqToCallback: true } as const;

  // With `verify` as first argument.
  const strat1 = new Strategy(verify, options);
  t.is((strat1 as any).verify, verify);
  t.is((strat1 as any).verifyWithReq, verify);
  t.true((strat1 as any).passReqToCallback);

  // With `verify` as second argument.
  const strat2 = new Strategy(options, verify);
  t.is((strat2 as any).verify, verify);
  t.is((strat2 as any).verifyWithReq, verify);
  t.true((strat2 as any).passReqToCallback);
});
