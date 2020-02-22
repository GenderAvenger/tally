const zipcodes = require('zipcodes');
const querystring = require('querystring');
const request = require('request');

function BallotLookup(zip) {
  this.zip = zip;
  const result = zipcodes.lookup(this.zip)
  this.latitude = result.latitude;
  this.longitude = result.longitude;
}

BallotLookup.prototype.getDistrictInformation = function(callback) {
  const params = {
    lat: this.latitude,
    long: this.longitude,
  };
  const url = 'https://api4.ballotpedia.org/sample_ballot_elections?' + querystring.stringify(params);
  request.get(url, function(err, res) {
    const result = JSON.parse(res.body);
    const districts = result.data.districts || [];
    const elections = result.data.elections || [];
    const districtIds = districts.map(function(district) {
      return district.id
    })
    callback(districtIds, elections);
  });
}

BallotLookup.prototype.getBallotCandidates = function(districtIds, electionDate, callback) {
  if(districtIds.length == 0) {
    return callback([]);
  }

  const params = {
    districts: districtIds.join(','),
    election_date: electionDate,
  }
  const url = 'https://api4.ballotpedia.org/sample_ballot_results?' + querystring.stringify(params);
  request.get(url, function(err, res) {
    const result = JSON.parse(res.body);
    const districts = result.data.districts || {}
    const races = Object.keys(districts).reduce(function(races, key) {
      const district = districts[key]
      const districtRaces = district.races || []
      return races.concat(districtRaces);
    }, []);
    const candidates = races.reduce(function(candidates, race) {
      const raceCandidates = race.candidates || []
      const decoratedCandidates = raceCandidates.map(function(candidate) {
        candidate.office = race.office;
        return candidate;
      });
      return candidates.concat(decoratedCandidates);
    }, []);
    callback(candidates);
  });
}

function onlyUniqueCandidates(value, index, self) {
  const firstInstanceOfThisCandidate = self.findIndex(function(candidate) {
    return candidate.id === value.id
  })
  return firstInstanceOfThisCandidate === index;
}

function groupCandidatesByOffice(candidates) {
  const officesDict = candidates.reduce(function(offices, candidate) {
    if (!(candidate.office.id in offices)) {
      offices[candidate.office.id] = {
        office: candidate.office,
        candidates: [],
      };
    }
    offices[candidate.office.id].candidates.push(candidate);
    return offices;
  }, {})

  const offices = Object.keys(officesDict).map(function(key) {
    const office = officesDict[key];
    office.candidates = office.candidates.filter(onlyUniqueCandidates)
    return office
  });
  return offices;
}

BallotLookup.prototype.run = function(callback) {
  const self = this;
  try {
    self.getDistrictInformation(function(districtIds, elections) {
      if (elections.length == 0) {
        return callback([])
      } else {
        const nextElection = elections[0];
        const nextElectionDate = nextElection.date;
        self.getBallotCandidates(districtIds, nextElectionDate, function(candidates) {
          const offices = groupCandidatesByOffice(candidates)
          callback(offices);
        })
      }
    })
  } catch (e) {
    callback([])
  }
}

module.exports = BallotLookup
