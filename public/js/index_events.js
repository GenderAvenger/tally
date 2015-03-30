$(function() {
  // Event Tracking
  $("#hashtag")
    .focus(function(e) {
      ga('send', 'event', 'hashtag', 'focus');
    })
    .blur(function(e) {
      var value = $(this).val()
      if($(this).val() == "")
        ga('send', 'event', 'hashtag', 'blur_empty');
      else 
        ga('send', 'event', 'hashtag', 'blur_full');
    })
  $("#women")
    .focus(function(e) {
      ga('send', 'event', 'women', 'focus');
    })
    .blur(function(e) {
      var value = $(this).val()
      if($(this).val() == "")
        ga('send', 'event', 'women', 'blur_empty');
      else 
        ga('send', 'event', 'women', 'blur_full', parseInt(value));
    })
  $("#men")
    .focus(function(e) {
      ga('send', 'event', 'men', 'focus');
    })
    .blur(function(e) {
      var value = $(this).val()
      if($(this).val() == "")
        ga('send', 'event', 'men', 'blur_empty');
      else 
        ga('send', 'event', 'men', 'blur_full', parseInt(value));
    })
  $("#session_text")
    .focus(function(e) {
      ga('send', 'event', 'session_text', 'focus');
    })
    .blur(function(e) {
      var value = $(this).val()
      if($(this).val() == "")
        ga('send', 'event', 'session_text', 'blur_empty');
      else 
        ga('send', 'event', 'session_text', 'blur_full');
    })
  $("#tally_form")
    .submit(function(e) {
      ga('send', 'event', 'tally_form', 'submit');
    })
  ga('send', 'event', 'tally_form', 'load');
})