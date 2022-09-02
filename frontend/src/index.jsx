import React from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import { createBrowserHistory } from 'history';
import { appService } from '@/_services';
import { App } from './App';

const container = document.getElementById('app');
const root = createRoot(container);

appService
  .getConfig()
  .then((config) => {
    window.public_config = config;

    if (window.public_config.APM_VENDOR === 'sentry') {
      const history = createBrowserHistory();
      const tooljetServerUrl = window.public_config.TOOLJET_SERVER_URL;
      const tracingOrigins = ['localhost', /^\//];
      const releaseVersion = window.public_config.RELEASE_VERSION
        ? `tooljet-${window.public_config.RELEASE_VERSION}`
        : 'tooljet';

      if (tooljetServerUrl) tracingOrigins.push(tooljetServerUrl);

      Sentry.init({
        dsn: window.public_config.SENTRY_DNS,
        debug: !!window.public_config.SENTRY_DEBUG,
        release: releaseVersion,
        integrations: [
          new Integrations.BrowserTracing({
            routingInstrumentation: Sentry.reactRouterV5Instrumentation(history),
            tracingOrigins: tracingOrigins,
          }),
        ],
        tracesSampleRate: 0.5,
      });
    }
  })
  .then(() => root.render(<App />));
