exports.index = function (req, res) {
    res.render('index', { title: 'Homepage'});
};
exports.report = function (req, res) {
    res.render('report', { title: 'Report'});
};
exports.submit = function (req, res) {
    res.render('submit', { title: 'Submit'});
};
