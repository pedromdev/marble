import * as url from 'url';
import { EMPTY } from 'rxjs';
import { fold } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { HttpEffectResponse } from '../effects/http-effects.interface';
import { HttpRequest, HttpResponse, HttpStatus } from '../http.interface';
import { bodyFactory } from './responseBody.factory';
import { headersFactory } from './responseHeaders.factory';
import { isStream } from '../+internal/utils';
import { ContextProvider } from '../context/context.factory';
import { ServerRequestMetadataStorageToken } from '../server/server.tokens';
import { getTestingRequestIdHeader, isTestingMetadataOn } from '../+internal/testing';

export const handleResponse = (ask: ContextProvider) => (res: HttpResponse) => (req: HttpRequest) => (effectResponse: HttpEffectResponse) => {
  if (res.finished) { return EMPTY; }

  const status = effectResponse.status || HttpStatus.OK;
  const path = url.parse(req.url).pathname || '';

  const headersFactoryWithData = headersFactory({ body: effectResponse.body, path, status });
  const headers = headersFactoryWithData(effectResponse.headers);

  const bodyFactoryWithHeaders = bodyFactory(headers);
  const body = bodyFactoryWithHeaders(effectResponse.body);

  const testingHeader = getTestingRequestIdHeader(req);

  if (isTestingMetadataOn()) {
    pipe(
      ask(ServerRequestMetadataStorageToken),
      fold(() => undefined, storage => storage.set(testingHeader, req.meta)),
    );
  }

  if (isStream(body)) {
    res.writeHead(status, headers);
    body.pipe(res);
  } else {
    if (body) {
      res.setHeader('Content-Length', Buffer.byteLength(body));
    }

    res.writeHead(status, headers);
    res.end(body);
  }

  return EMPTY;
};
