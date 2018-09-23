import { httpListener } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { logger$ } from '@marblejs/middleware-logger';
import { api$ } from './effects/api.effects';

const middlewares = [
  logger$,
  bodyParser$,
];

const effects = [
  api$,
];

export const app = httpListener({ middlewares, effects });
