var _      = require('lodash'),
    fs     = require('fs'),
    Firebase = require('firebase'),
    csv = require('express-csv'),
    app = require('../server').app,
    firebaseDatastore = require('../server').firebaseDatastore;

app.get('/data', function(req, res, next){
  // fetch all plots
  var plotRef = firebaseDatastore.child('plots/');

  // set up row headers
  csv_rows = [
    ["timestamp", "session_text","hashtag","women","men", "full_url"]
  ];

  // TODO set this up with promises so we
  // can query other data, like DISQUSS engagement
  // and Twitter/Facebook engagement
  plotRef.once('value', function(snapshot) {
      var plot = snapshot.val();
      // iterate through reports and push onto report CSVs
      _.forEach(plot, function(report, key) {
          var full_url = req.protocol + '://' + req.get('host') + "/share/" + report.pie_id;
          csv_rows.push([report.timestamp, report.session_text, report.hashtag, report.women, report.men, full_url]);
      });
      res.csv(csv_rows);
  });
});
