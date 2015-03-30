$(function() {
  // Event Tracking
  $("#fb-share-button")
    .click(function(e) {
      ga('send', 'event', 'facebook_share_button', 'click');
    })
  $("#twitter-share-button")
    .click(function(e) {
      ga('send', 'event', 'twitter_share_button', 'click');
    })
  $("#make-button")
    .click(function(e) {
      ga('send', 'event', 'make_button', 'click');
    })
  $("#anonymous-button")
    .click(function(e) {
      ga('send', 'event', 'anonymous_button', 'click');
    })
  ga('send', 'event', 'chart', 'load');
})