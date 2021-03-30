/*
 * For Magdy:
 * Create .env
 *   PORTAL_BEARER_TOKEN=unused
 *   PF_BEARER_TOKEN=<token>
 * Run
 *   yarn -s do src/api-poking/geocode-test-direct.js >/tmp/output.csv
 */

import axios from 'axios';
import console from 'console';
require('dotenv-safe').config();

import { note, say, output, die } from 'util/cli';

const inputAddresses = [
  '# Addresses that should be valid',
  '100 Harris Street, Pyrmont, NSW 2009',
  '146 Homebush Road, Strathfield, NSW 2135',
  '9/11-13 Clarence Street, Burwood, NSW 2134',
  '99/11-13 Clarence Street, Burwood, NSW 2134',
  '11-13 Clarence Street, Burwood, NSW 2134',
  '50 Valdora View, Valdora, QLD 4561',
  '16 The Escarpments, Katoomba, NSW 2780',
  '8 Station Street, Pymble, NSW 2073',
  '1 Cayambe Court, Tamborine Mountain',
  '37 Daphne Street, Botany NSW',
  '1/37 Daphne Street, Botany NSW',
  '20/37 Daphne Street, Botany NSW',
  '11 Valentine street, Yagoona, NSW 2199',
  '1 Griffiths street, Blacktown NSW 2148',
  '6 Griffiths street, Blacktown NSW 2148',
  '179 Dunmore street, Wentworthville',
  '34 Northwater Drive, Hope Island',
  '26 Gold Street, Banyo',
];



const API = axios.create({
  baseURL: 'https://staging-geocode-api.pricefinder.com.au',
});
if (!API) { die("Couldn't create API object"); }

API.interceptors.request.use(
  config => {
    const newConfig = { ...config };
    newConfig.metadata = { startTime: new Date() };
    newConfig.headers.Authorization = `Bearer ${process.env.PF_BEARER_TOKEN}`;
    return newConfig;
  },
  error => {
    return Promise.reject(error);
  }
);
API.interceptors.response.use(
  response => {
    const newRes = { ...response };
    newRes.config ||= {};
    newRes.config.metadata ||= {};
    newRes.config.metadata.endTime = new Date();
    newRes.duration = newRes.config.metadata.endTime - newRes.config.metadata.startTime;
    return newRes;
  },
  error => {
    const newError = { ...error };
    newError.config ||= {};
    newError.config.metadata ||= {};
    newError.config.metadata.endTime = new Date();
    newError.duration = newError.config.metadata.endTime - newError.config.metadata.startTime;
    return Promise.reject(newError);
  }
);

const getData = async (address, advanced) => {
  const isComment = address.match(/^# (.*)$/);
  if (isComment) {
    return Promise.resolve({ header: isComment[1] });
  }

  return API
    .get('/v1/geocode', { 
      params: {
        search_method: advanced ? 'advanced' : 'simple',
        q: address,
      },
    })
    .then(res => {
      try {
        const r = res.data;
        if (r && r.score) {
          note(`Got data with score for ${address} in ${res.duration}ms`);
          r.duration = res.duration;
        } else {
          note(`Got data WITHOUT score for ${address} in ${res.duration}ms`);
        }
        return r;
      } catch (e) {
        note('ERR:', e, res);
        return {};
      }
    })
    .catch(err => note('ERROR', err.response.status, err.response.statusText, err.response.data));
};

const processAll = async addresses => {
  const results = await axios.all(
    addresses.map(address => getData(address, true))
  );
  console.log(
    'Input address, JSON response'
  );
  for (let i = 0; i < addresses.length; i++) {
    const fields = [addresses[i]];
    if (results[i] == null) {
      output(`"${addresses[i]}", "error"`);
      continue;
    }
    if (results[i].header) {
      output(`"${results[i].header}"`);
      continue;
    }
    fields.push(JSON.stringify(results[i]));

    output(fields.map(f => `"${f.replaceAll('"', '""')}"`).join(', '));
  }
};

processAll(inputAddresses).then(() => note('Done.'));
