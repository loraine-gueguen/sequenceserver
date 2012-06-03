//helpers methods to disable, enable, and uncheck radio buttons and checkboxes
(function( $ ){
    //disable an element
    $.fn.disable = function() {
        return this.attr('disabled', 'disabled');
    };
})( jQuery );

(function( $ ){
    //enable an element
    $.fn.enable = function() {
        return this.removeAttr('disabled');
    };
})( jQuery );

(function( $ ){
    //uncheck an element
    $.fn.uncheck = function() {
        return this.removeAttr('checked');
    };
})( jQuery );

(function( $ ){
    //check an element
    $.fn.check = function() {
        return this.attr('checked', 'checked');
    };
})( jQuery );

(function( $ ){
    //(pre-)check the only active database checkbox
    $.onedb = function(selector) {
        active_dbs = $(".databases input[type=checkbox]").not(":disabled")
        if (active_dbs.length == 1){
            active_dbs.check()
        }
        return active_dbs;
    };
})( jQuery );

(function( $ ){
    //highlight an element
    $.fn.highlight = function() {
        return this.addClass('focussed');
    };
})( jQuery );

(function( $ ){
    //unhighlight an element
    $.fn.unhighlight = function() {
        return this.removeClass('focussed');
    };
})( jQuery );

(function ($) {
    //pass `null` to unset
    $.fn.set_blast_method = function (name) {
        var value = name || '';
        var name  = name || 'blast';
        var tokens = name.split('blast');
        this.val(value).children('span.highlight').each(function (i) {
            $(this).text(tokens[i]);
        });
    };
})(jQuery);

(function ($) {
    $.fn.poll = function () {
        var that, val, tmp;

        that = this;

        (function ping () {
            tmp = that.val();

            if (tmp != val){
                val = tmp;
                that.change();
            }

            setTimeout(ping, 100);
        }());

        return this;
    };
}(jQuery));

/*
    SS - SequenceServer's JavaScript module

    Define a global SS (acronym for SequenceServer) object containing the
    following methods:

        main():
            Initializes SequenceServer's various modules.
*/

//define global SS object
var SS;
if (!SS) {
    SS = {};
}

//SS module
(function () {

    /*
        ask each module to initialize itself
    */
    SS.main = function () {
        SS.blast.init();
    }
}()); //end SS module

$(document).ready(function(){
    // poll the sequence textbox for a change in user input
    $('#sequence').poll();

    // start SequenceServer's event loop
    SS.main();

    var notification_timeout;

    $('#sequence').on('sequence_type_changed', function (event, type) {
        clearTimeout(notification_timeout);
        $(this).parent('.control-group').removeClass('error');
        $('.notifications .active').hide().removeClass('active');

        if (type) {
            $('#' + type + '-sequence-notification').show('drop', {direction: 'up'}).addClass('active');

            notification_timeout = setTimeout(function () {
                $('.notifications .active').hide('drop', {direction: 'up'}).removeClass('active');
            }, 5000);

            if (type === 'mixed') {
                $(this).parent('.control-group').addClass('error');
            }
        }
    });

    $('body').click(function () {
        $('.notifications .active').hide('drop', {direction: 'up'}).removeClass('active');
    });

    $('.databases').on('database_type_changed', function (event, type) {
        switch (type) {
            case 'protein':
                $('.databases.nucleotide input:checkbox').uncheck().disable();
                break;
            case 'nucleotide':
                $('.databases.protein input:checkbox').uncheck().disable();
                break;
            default:
                $('.databases input:checkbox').enable();
                break;
        }
    });

    $('form').on('blast_method_changed', function (event, methods){
        if (methods) {
            var method = methods.shift();

            $('#method').enable().set_blast_method(method);

            if (methods.length >=1) {
                $('#methods').addClass('btn-group').
                    children('.dropdown-toggle').show();

                var methods_list = $.map(methods, function (method, _) {
                    return "<li>" + method + "</li>";
                }).join('');

                $('#methods .dropdown-menu').html(methods_list);
            }

            // jiggle
            $("#methods").effect("bounce", { times:5, direction: 'left', distance: 12 }, 120);
        }
        else {
            $('#method').disable().set_blast_method(null);
            $('#methods').removeClass('btn-group').children('.dropdown-toggle').hide();
        }
    });

    $('#methods .dropdown-menu').click(function (event) {
        // The list of possible blast methods is dynamically generated.  So we
        // leverage event bubbling to trap 'click' event on the list items.
        var clicked = $(event.target);
        var mbutton = $('#method');

        var old_method = mbutton.text();
        var new_method = clicked.text();

        //swap
        clicked.text(old_method);
        mbutton.set_blast_method(new_method);

        // jiggle
        $("#methods").effect("bounce", { times:5, direction: 'left', distance: 12 }, 120);
    });

    $("input#advanced").enablePlaceholder({"withPlaceholderClass": "greytext"});
    $("textarea#sequence").enablePlaceholder({"withPlaceholderClass": "greytext"});

    $('.advanced pre').hover(function () {
        $(this).addClass('hover-focus');
    },
    function () {
        $(this).removeClass('hover-focus');
    });

    $('#blast').submit(function(){
        //parse AJAX URL
        var action = $(this).attr('action');
        var index  = action.indexOf('#');
        var url    = action.slice(0, index);
        var hash   = action.slice(index, action.length);

        // display a modal window and attach an activity spinner to it
        $('#spinner').modal();
        $('#spinner > div').activity({
           segments: 8,
           length:   40,
           width:    16,
           speed:    1.8
        });

        // BLAST now
        var data = ($(this).serialize() + '&method=' + $('#method').val());
        $.post(url, data).
          done(function (data) {
            // BLASTed successfully

            // display the result
            $('.results').show();
            $('#result').html(data);

            $('#blast').addClass('detached-bottom');
            $('#underbar').addClass('detached-top');

            //generate index
            $('.resultn').index({container: '.results'});

            //jump to the results
            location.hash = hash;

            $('#result').
                scrollspy().
                on('enter.scrollspy', function () {
                    $('.index').removeAttr('style');
                }).
                on('leave.scrollspy', function () {
                    $('.index').css({position: 'absolute', top: $(this).offset().top});
                });

            $('.resultn').
                scrollspy({
                    approach: screen.height / 4
                }).
                on('enter.scrollspy', function () {
                    var id = $(this).attr('id');
                    $(this).highlight();
                    $('.index').find('a[href="#' + id + '"]').parent().highlight();

                    return false;
                }).
                on('leave.scrollspy', function () {
                    var id = $(this).attr('id');
                    $(this).unhighlight();
                    $('.index').find('a[href="#' + id + '"]').parent().unhighlight();

                    return false;
                });
        }).
          fail(function (jqXHR, status, error) {
            //alert user
            $("#error-type").text(error);
            $("#error-message").text(jqXHR.responseText);
            $("#error").modal();
        }).
          always(function () {
            // BLAST complete (succefully or otherwise)

            // remove progress notification
            $('#spinner > div').activity(false);
            $('#spinner').modal('hide');
        });

        return false;
    });

    $('.results').
        on('add.index', function (event, index) {
            // make way for index
            $('#result').css({width: '660px'});

            $(index).addClass('box');
        }).
        on('remove.index', function () {
            $('#result').removeAttr('style');
        });
});
