var app = require('../server').app,
    firebaseDatastore = require('../server').firebaseDatastore;

app.get('/dashboard', function (req, res, next) {

  res.render('dashboard.html', {
  });

});

app.get('/charts/:endTime?/:startTime?', function (req, res, next) {

  var query = null;
  var end = Date.now();
  var start = end;
  if(req.params.endTime)
    end = parseInt(req.params.endTime);

  if(req.params.startTime)
    start = parseInt(req.params.startTime);
  else
    start = end - 86400000 * 5; // get a five day window day by default

  console.log (start + ":" + end);
  firebaseDatastore.child("plots")
    .startAt(start)
    .endAt(end)
    .once("value", function(snapshot) {
      res.send(JSON.stringify(snapshot.val()));
    });
});


app.get('/clean', function (req, res, next) {

  query = firebaseDatastore.child("plots");

  query.on("child_added", function(snapshot) {
    var val = snapshot.val();
    var d = new Date(val.timestamp);
    snapshot.ref().update({
      "unicode-timestamp": d.getTime()
    })
    snapshot.ref().setPriority(d.getTime());
  });
});
