$(function() {

  var renderCharts = function(newCharts) {
    console.log(newCharts);
  }

  var loadCharts = function(modifier, plotId) {

    var url = '/charts';

    switch(modifier) {
      case 'start':
        break;
      case 'before':
        url += '/before/' + plotId;
        break;
      case 'after':
        url += '/after/' + plotId;
        break;
    }
    $.get(url)
      .done(function(data) {
        renderCharts(data);
      });

  }

  loadCharts('start')

})
