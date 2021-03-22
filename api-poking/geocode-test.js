import axios from 'axios';
import console from 'console';

const note = (...args) => console.error(...args);
const say = (...args) => console.log(...args);
const output = (...args) => process.stdout.write(args.join(', ') + "\n");

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

  '# Formerly failing addresses we want to pass',
  '9/11-1300 Clarence Street, Burwood, NSW 2134',

  '# Deliberately bad addresses we want to fail',
  '100 Harros Street, Pyrmont, NSW 2009',
  '100 Undefined Street, Pyrmont, NSW 2009',
  '9/11-13 Clarence, Burwood, NSW 2134',
  '9/11-13 Clarence Road, Burwood, NSW 2134',
  '9-130000 Griffiths, Blacktown NSW 2148',
];

const getQuery = (address, advanced) => `query {
  geocode(query: "${address}", useAdvancedSearch: ${advanced}) {
    address {
      buildingName
      countryCode
      level
      lga
      locality
      lot
      postcode
      unit
      streetType
      streetSuffix
      streetNumber
      streetName
      streetLocation
      streetAddress
      street
      state
    }
    score {
      consolidatedScore
      streetNumberScore
      streetNameScore
      streetTypeScore
      streetSuffixScore
      suburbScore
      stateScore
      postcodeScore
      countryScore
    }
    isSuccessful
    isExactMatch
    isStreetLevelMatch
    matchMethod
    matchLevel
  }
}`;

const getData = async (address, advanced) => {
  const isComment = address.match(/^# (.*)$/);
  if (isComment) {
    return Promise.resolve({ header: isComment[1] });
  }

  return axios
    .post('http://localhost:5000/gql', {
      query: getQuery(address, advanced),
    })
    .then(res => {
      try {
        const gqlResponse = res.data.data.geocode;
        if (gqlResponse) {
          note('Got data for', address);
        } else {
          note('Got null data for', address, res.data);
        }
        return gqlResponse;
      } catch (e) {
        note('ERR:', e, res);
        return {};
      }
    })
    .catch(err => note('ERROR', err));
};

const processAll = async addresses => {
  const results = await axios.all(
    addresses.map(address => getData(address, true))
  );
  console.log(
    'Input address, isSuccessful, isExactMatch, isStreetLevelMatch, matchMethod, matchLevel, consolidatedScore, streetNumberScore, streetNameScore, streetTypeScore, streetSuffixScore, suburbScore, stateScore, postcodeScore, countryScore, unit, streetType, streetAddress, street, streetSuffix, locality, state, postcode'
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
    fields.push(results[i]?.isSuccessful);
    fields.push(results[i]?.isExactMatch);
    fields.push(results[i]?.isStreetLevelMatch);
    fields.push(results[i]?.matchMethod);
    fields.push(results[i]?.matchLevel);

    fields.push(results[i]?.score?.consolidatedScore);
    fields.push(results[i]?.score?.streetNumberScore);
    fields.push(results[i]?.score?.streetNameScore);
    fields.push(results[i]?.score?.streetTypeScore);
    fields.push(results[i]?.score?.streetSuffixScore);
    fields.push(results[i]?.score?.suburbScore);
    fields.push(results[i]?.score?.stateScore);
    fields.push(results[i]?.score?.postcodeScore);
    fields.push(results[i]?.score?.countryScore);

    fields.push(results[i]?.address?.unit);
    fields.push(results[i]?.address?.streetType);
    fields.push(results[i]?.address?.streetAddress);
    fields.push(results[i]?.address?.street);
    fields.push(results[i]?.address?.streetSuffix);
    fields.push(results[i]?.address?.locality);
    fields.push(results[i]?.address?.state);
    fields.push(results[i]?.address?.postcode);

    output(fields.map(f => `"${f}"`).join(', '));
  }
};

processAll(inputAddresses).then(() => note('Done.'));
