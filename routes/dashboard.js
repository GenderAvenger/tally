var app = require('../server').app,
    firebaseDatastore = require('../server').firebaseDatastore;

app.get('/dashboard', function (req, res, next) {

  res.render('dashboard.html', {

  });

});

app.get('/charts/:modifier/:date', function (req, res, next) {

  firebaseDatastore.child("plots").orderByChild("timestamp").limit(100).on("child_added", function(snapshot) {
    console.log(snapshot.val());
  });
  //  res.send(JSON.stringify(firebaseDatastore.orderByKey('plots')));

});
