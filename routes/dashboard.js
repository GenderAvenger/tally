var app = require('../server').app,
    firebaseDatastore = require('../server').firebaseDatastore;

app.get('/dashboard', function (req, res, next) {

  res.render('dashboard.html', {
  });

});

// app.get('/charts/:endTime?/:startTime?', function (req, res, next) {

//   var query = null;
//   var end = Date.now();
//   var start = end;
//   if(req.params.endTime) {
//     end = req.params.endTime;
//   }

//   if(req.params.startTime) {
//     start = req.params.startTime;
//   } else {
//     start = end - 86400 * 5; // get one day by default
//   }

//   query = firebaseDatastore.child("plots").orderByChild("unicode-timestamp").startAt(start).endAt(end);//.limitToLast(4);

//   query.once("value", function(snapshot) {
//     res.send(JSON.stringify(snapshot.val()));
//   });
// });


// app.get('/clean', function (req, res, next) {

//   query = firebaseDatastore.child("plots");

//   query.on("child_added", function(snapshot) {
//     var val = snapshot.val();
//     var d = new Date(val.timestamp);
//     snapshot.ref().update({
//       "unicode-timestamp": d.getTime()
//     })
//   });
// });
