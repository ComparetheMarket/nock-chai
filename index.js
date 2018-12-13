/* eslint-disable no-underscore-dangle */

const equal = require('deep-equal');

module.exports = chai => {
  const { Assertion } = chai;
  const MAX_TIMEOUT = 2000;

  function promisfyNockInterceptor(nock) {
    return new Promise((resolve, reject) => {
      let body;
      let receivedHeaders;

      const timeout = setTimeout(() => {
        reject(new Error('The request has not been recieved by Nock'));
      }, MAX_TIMEOUT);

      nock.once('request', ({ headers }, interceptor, reqBody) => {
        try {
          receivedHeaders = headers;

          body = JSON.parse(reqBody);
        } catch (err) {
          body = reqBody;
        }
      });

      nock.once('replied', () => {
        clearTimeout(timeout);
        resolve({ body, receivedHeaders });
      });

      nock.on('error', err => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  function isNock(obj) {
    if (
      typeof obj !== 'object' ||
      !obj.interceptors ||
      !obj.interceptors.length
    ) {
      throw new TypeError('You must provide a valid Nock');
    }
  }

  Assertion.addProperty('requested', () => {
    isNock(this._obj);
    const assert = value => {
      this.assert(
        value,
        'expected Nock to have been requested',
        'expected Nock to have not been requested',
      );
    };

    return promisfyNockInterceptor(this._obj).then(
      () => assert(true),
      () => assert(false),
    );
  });

  Assertion.addMethod('requestedWith', arg => {
    isNock(this._obj);

    return promisfyNockInterceptor(this._obj).then(
      nockRequest => {
        if (equal(nockRequest, arg)) {
          return this.assert(
            true,
            null,
            'expected Nock to have not been requested with #{exp}',
            arg,
          );
        }
        return this.assert(
          false,
          'expected Nock to have been requested with #{exp}, but was requested with #{act}',
          'expected Nock to have not been requested with #{exp}',
          arg,
          nockRequest,
        );
      },
      () =>
        this.assert(
          false,
          'expected Nock to have been requested, but it was never called',
        ),
    );
  });

  Assertion.addMethod('requestedWithExactHeaders', arg => {
    isNock(this._obj);

    return promisfyNockInterceptor(this._obj).then(
      ({ receivedHeaders }) => {
        if (equal(receivedHeaders, arg)) {
          return this.assert(
            true,
            null,
            'expected Nock to have not been requested with exact headers #{exp}',
            arg,
          );
        }
        return this.assert(
          false,
          'expected Nock to have been requested with exact headers #{exp}, but was requested with headers #{act}',
          'expected Nock to have not been requested with exact headers #{exp}',
          arg,
          receivedHeaders,
        );
      },
      () =>
        this.assert(
          false,
          'expected Nock to have been requested, but it was never called',
        ),
    );
  });

  Assertion.addMethod('requestedWithHeaders', arg => {
    isNock(this._obj);

    return promisfyNockInterceptor(this._obj).then(
      ({ receivedHeaders }) => {
        const mergedHeaders = Object.assign({}, receivedHeaders, arg);
        if (equal(receivedHeaders, mergedHeaders)) {
          return this.assert(
            true,
            null,
            'expected Nock to have not been requested with headers #{exp}',
            arg,
          );
        }
        return this.assert(
          false,
          'expected Nock to have been requested with headers #{exp}, but was requested with headers #{act}',
          'expected Nock to have not been requested with #{exp}',
          arg,
          receivedHeaders,
        );
      },
      () =>
        this.assert(
          false,
          'expected Nock to have been requested, but it was never called',
        ),
    );
  });
};
