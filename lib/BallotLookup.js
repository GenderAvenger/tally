const zipcodes = require('zipcodes');
const querystring = require('querystring');
const request = require('request');

function BallotLookup(zip) {
  this.zip = zip;
  const result = zipcodes.lookup(this.zip)
  this.latitude = result.latitude;
  this.longitude = result.longitude;
}

BallotLookup.prototype.getDistrictIds = function(callback) {
  const params = {
    access_token: process.env['BALLOT_LOOKUP_TOKEN'],
    point: this.latitude + ',' + this.longitude,
  };
  const url = 'https://api.ballotpedia.org/v3/api/sbl-elections?' + querystring.stringify(params);
  request.get(url, function(err, res) {
    const result = JSON.parse(res.body);
    const districts = result.districts || [];
    callback(districts.map(function(district) {
      return district.id
    }));
  });
}

BallotLookup.prototype.getBallotCandidates = function(districtIds, callback) {
  if(districtIds.length == 0) {
    return callback([]);
  }

  const params = {
    access_token: process.env['BALLOT_LOOKUP_TOKEN'],
    districts: districtIds.join(','),
    election_date: '2019-11-05', // TODO: this should be a configurable constant
  }
  const url = 'https://api.ballotpedia.org/v3/api/sbl-results?' + querystring.stringify(params);
  request.get(url, function(err, res) {
    const result = JSON.parse(res.body);
    const districts = result.districts || {}
    const races = Object.keys(districts).reduce(function(races, key) {
      const district = districts[key]
      const districtRaces = district.races || []
      return races.concat(districtRaces);
    }, []);
    const candidates = races.reduce(function(candidates, race) {
      return candidates.concat(race.candidates);
    }, []);
    callback(candidates);
  });
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

BallotLookup.prototype.run = function(callback) {
  const self = this;
  try {
    self.getDistrictIds(function(ids) {
      self.getBallotCandidates(ids, function(candidates) {
        var names = candidates.map(function(candidate) {
          return candidate.person.name;
        })
        uniqueNames = names.filter(onlyUnique);
        callback(uniqueNames);
      })
    })
  } catch (e) {
    callback([])
  }
}

module.exports = BallotLookup
