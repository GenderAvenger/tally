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
    callback(result.districts.map(function(district) {
      return district.id
    }));
  });
}

BallotLookup.prototype.getBallotCandidates = function(districtIds, callback) {
  const params = {
    access_token: process.env['BALLOT_LOOKUP_TOKEN'],
    districts: districtIds.join(','),
    election_date: '2019-11-05', // TODO: this should be a configurable constant
  }
  const url = 'https://api.ballotpedia.org/v3/api/sbl-results?' + querystring.stringify(params);
  request.get(url, function(err, res) {
    const result = JSON.parse(res.body);
    console.log(result)
    const races = Object.keys(result.districts).reduce(function(races, key) {
      const district = result.districts[key]
      return races.concat(district.races);
    }, []);
    const candidates = races.reduce(function(candidates, race) {
      return candidates.concat(race.candidates);
    }, []);
    callback(candidates);
  });
}

BallotLookup.prototype.run = function(callback) {
  const self = this;
  self.getDistrictIds(function(ids) {
    self.getBallotCandidates(ids, callback);
  })
}

module.exports = BallotLookup
