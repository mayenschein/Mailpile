$(document).on('click', '.icon-tags', function(e) {

  e.preventDefault();
  var tid = $(this).parent().data('tid');

  $.each($('.subtag-of-' + tid), function(key, item) {
    if ($(this).css('display') === 'none') {
      $(this).show();
    }
    else {
      $(this).hide();
    }
  });
});


$(document).on('click', '.is-editing', function(e) {
  e.preventDefault();
});


$(document).on('click', '.button-sidebar-edit', function() {

  var new_message = $(this).data('message');
  var old_message = $(this).html();

  if ($(this).data('state') === 'done') {

    // Disable Drag & Drop
    $('a.sidebar-tag').draggable({ disabled: true });
    
    // Update Cursor Make Links Not Work
    $('.sidebar-sortable li').addClass('is-editing');

    // Hide Notification & Subtags
    $('.sidebar-notification').hide();
    $('.sidebar-subtag').hide();

    // Add Minus Button
    $.each($('.sidebar-tag'), function(key, value) {
      $(this).append('<span class="sidebar-tag-archive icon-minus"></span>');
    });

    // Update Edit Button
    $(this).data('message', old_message).data('state', 'editing').html('<span class="icon-checkmark"></span> ' + new_message);
  }
  else {

    // Enable Drag & Drop
    $('a.sidebar-tag').draggable({ disabled: false });    

    // Update Cursor Make Links Not Work
    $('.sidebar-sortable li').removeClass('is-editing');

    // Show Notification / Hide Minus Button
    $('.sidebar-notification').show();
    $('.sidebar-tag-archive').remove();

    // Update Edit Button
    $(this).data('message', old_message).data('state', 'done').html(new_message);
  }
});


$(document).on('click', '.sidebar-tag-archive', function(e) {
  e.preventDefault();
  // FIXME: This should use Int. language
  alert('This will mark this tag as "archived" and remove it from your sidebar, you can go edit this in the Tags -> Tag Name -> Settings page at anytime');
  mailpile.tag_update($(this).parent().data('tid'), 'display', 'archive', function() {
    $(this).parent().parent().fadeOut();
  });
});


$(document).ready(function() {


  // Drag Sort Tag Order
	$( ".sidebar-sortable" ).sortable({
		placeholder: "sidebar-tags-sortable",
    distance: 13,
    scroll: false,
    opacity: 0.8,
		stop: function(event, ui) {
     
      var get_order = function(index, base) {
        $elem = $('.sidebar-sortable li:nth-child(' + index + ')');
        if ($elem.length) {
          return $elem.data('display_order');
        }
        else {
          return base
        }        
      };

      var tid   = $(ui.item).data('tid');
			var index = $(ui.item).index();

      // Calculate new orders
      var previous  = get_order(index, 0);
      var next      = get_order((parseInt(index) + 2), 1000000);
      var new_order = (parseFloat(previous) + parseFloat(next)) / 2;

      // Save Tag Order
      mailpile.tag_update(tid, 'display_order', new_order, function() {

        // Update Current Element
        $(ui.item).attr('data-display_order', new_order).data('display_order', new_order);
      });
		}
	}).disableSelection();
  

  // Drag Tags to Search Messages
  $('a.sidebar-tag').draggable({
    containment: "#container",
    appendTo: 'body',
    cursor: 'move',
    distance: 15,
    scroll: false,
    revert: false,
    opacity: 1,
    helper: function(event) {
      var count = '';
      if (mailpile.messages_cache.length > 0) {
        count = ' to (' + mailpile.messages_cache.length + ')';
      }

      var tag = _.findWhere(mailpile.instance.tags, { tid: $(this).data('tid').toString() });
      return $('<div class="sidebar-tag-drag ui-widget-header" style="color: ' + tag.label_color + '"><span class="' + tag.icon + '"></span> ' + tag.name + count + '</div>');
    }
  });


  $('#pile-results tr').droppable({
    accept: 'a.sidebar-tag',
    hoverClass: 'result-hover',
    tolerance: 'pointer',
    drop: function(event, ui) {

      // Update Cache
      mailpile.bulk_cache_add('messages_cache', $(event.target).data('mid'));

      // Save Update
      mailpile.tag_add_delete(ui.draggable.data('tid'), '', mailpile.messages_cache, function() {

        var tag = _.findWhere(mailpile.instance.tags, { tid: ui.draggable.data('tid').toString() });
        var updated = [];

        // Update Multiple Selected Messages
        if (mailpile.messages_cache.length > 0) {
          $.each(mailpile.messages_cache, function(key, mid) {
            updated.push(mid)
            $('#pile-message-' + mid).find('td.subject span.item-tags').append('<span class="pile-message-tag" style="color: ' + tag.label_color + ';"><span class="pile-message-tag-icon ' + tag.icon + '"></span> <span class="pile-message-tag-name">' + tag.name + '</span></span>');
          });
        }
      });
    }
  });

});