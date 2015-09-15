$(function() {

  var headTime = Date.now();
  var tailTime = Date.now();

  var renderCharts = function(newCharts) {
    var keys = Object.keys(newCharts);
    keys = keys.reverse();
    for(var x in keys) {
      var chartCode = keys[x];
      var chart = newCharts[chartCode];
      if(!chart.hashtag)
        chart.hashtag = "(none)"; // In case hash isn't set somehow

      var hashCode = chart.hashtag.replace(/[^a-zA-Z0-9]/,"");

      var timestamp = new Date(chart.timestamp);
      var dateCode = (timestamp.getMonth() + 1) + "-" + timestamp.getDate() + "-" + timestamp.getFullYear()

      // Does this date exist?
      var $date = $("#date-" + dateCode);
      if($date.length == 0) {
        $date = $("<li>")
          .attr("id", "date-" + dateCode)
          .addClass("date")
          .appendTo($("#timeline"));

        $dateTitle = $("<h2>")
          .text((timestamp.getMonth() + 1) + "/" + timestamp.getDate() + "/" + timestamp.getFullYear())
          .appendTo($date);

      }

      // Does this hashtag exist for this date?
      var $hash = $("#hash-" + hashCode + "-" + dateCode);
      if($hash.length == 0) {
        $hash = $("<li>")
          .attr("id", "hash-" + hashCode + "-" + dateCode)
          .addClass("hash")
          .appendTo($date);

        $hashTitle = $("<a>")
          .attr("href", "https://twitter.com/search?q=" + encodeURIComponent(chart.hashtag))
          .attr("target", "_blank")
          .addClass("title")
          .text(chart.hashtag)
          .appendTo($hash);
      }

      // Does the chart exist?
      var $chart = $("#chart-" + chartCode);
      if($chart.length != 0) {
        continue;
      }

      $chart = $("<div>")
        .attr("id", chartCode)
        .addClass("chart")
        .appendTo($hash);

      $chartTitle = $("<h4>")
        .addClass("chart-title")
        .text(chart.session_text)
        .appendTo($chart);

      $chartLink = $("<a>")
        .attr("href", "http://app.genderavenger.com/plot/" + chartCode)
        .attr("target", "_blank")
        .addClass("chart-link")
        .appendTo($chart);

      $chartImage = $("<img>")
        .attr("src", chart.pie_url)
        .addClass("chart-image")
        .appendTo($chartLink);

      $chartStats = $("<div>")
        .addClass("chart-stats")
        .appendTo($chart);

      // Get share counts
      (function() {
        var targetChart = chart;
        var $targetChart = $chart;
        var $targetStats = $chartStats;
        $.ajax("https://cdn.api.twitter.com/1/urls/count.json?url=" + encodeURIComponent("http://app.genderavenger.com/plot/" + chartCode), {
          dataType: "jsonp",
          method: "GET"
        }).done(function(data) {
          var $chartStats_twitter = $("<a>")
            .attr("href", "https://twitter.com/search?q=" + encodeURIComponent("http://app.genderavenger.com/plot/" + targetChart.pie_id))
            .attr("target", "_blank")
            .addClass("twitter")
            .html(data.count)
            .appendTo($targetStats)
          $chart.data("twitter", data.count)
        })

        $.ajax("http://api.facebook.com/restserver.php?method=links.getStats&urls="+encodeURIComponent("http://app.genderavenger.com/plot/" + chartCode)+"&format=json", {
          dataType: "jsonp",
          method: "GET"
        }).done(function(data) {
          var total_count = 0;
          if(data.length >0)
            total_count = data[0].total_count;

          var $chartStats_facebook = $("<a>")
            .attr("href", "https://facebook.com/search?q=" + encodeURIComponent("http://app.genderavenger.com/plot/" + targetChart.pie_id))
            .attr("target", "_blank")
            .addClass("facebook")
            .html(total_count)
            .appendTo($targetStats)
          $chart.data("facebook", total_count)
        })

      })()
    }
  }

  var loadOldActive = false;
  var loadOld = function() {
    if(loadOldActive)
      return;

    // Don't load old things too many times
    loadOldActive = true;

    var newTailTime = tailTime - 60*60*24*1000*5; // 5 days
    $.ajax('charts/' + tailTime + "/" + newTailTime,
      {
        dataType: "JSON",
        method: "GET"
      })
      .done(function(data) {
        renderCharts(data);
        loadOldActive = false;
        setTimeout(checkScroll, 1000);
      });
    tailTime = newTailTime;
  }

  var loadNew = function() {
    var newHeadTime = Date.now();
    $.get('charts/' + newHeadTime + "/" + headTime)
      .done(function(data) {
        renderCharts(data);
      });
    headTime = newHeadTime;

  }

  loadOld();

  $timeline = $("#timeline");
  var checkScroll = function() {
    if($timeline[0].scrollWidth - $timeline.scrollLeft() - 1 <= $timeline.outerWidth() ||
       $timeline[0].scrollWidth < $(document).width()) {
      loadOld();
    }
  };
  $timeline.scroll(checkScroll);
})
