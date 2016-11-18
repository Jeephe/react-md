import express from 'express';
import compression from 'compression';
import logger from 'morgan';
import bodyParser from 'body-parser';
import Promise from 'bluebird';
import vhost from 'vhost';
import { middleware as cache } from 'apicache';

import docgen, { buildLocalDB as buildDocgenDB } from './docgen';
import sassdoc, { buildLocalDB as buildSassDocDB } from './sassdoc';
import search, { buildLocalDB as buildSearchDB } from './search';
import { port, host, path } from '../../serverConfig.json';

const DEV = process.env.NODE_ENV === 'development';

const app = express();

app.disable('x-powered-by');
app.set('etag', 'strong');
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger(DEV ? 'dev' : 'combined'));

if (path) {
  const router = express.Router();
  router.use('/docgens', cache('5 minutes'), vhost(host, docgen));
  router.use('/sassdocs', cache('5 minutes'), vhost(host, sassdoc));
  router.use('/search', cache('5 minutes'), vhost(host, search));

  app.use('/api', router);
} else {
  app.use('/docgens', cache('5 minutes'), vhost(host, docgen));
  app.use('/sassdocs', cache('5 minutes'), vhost(host, sassdoc));
  app.use('/search', cache('5 minutes'), vhost(host, search));
}

(async () => {
  await Promise.all([buildDocgenDB(), buildSassDocDB(), buildSearchDB()]);

  app.listen(port, err => {
    if (err) {
      throw err;
    }

    console.log(`Listening to api calls on port ${port}`);
  });
})();