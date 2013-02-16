/*jslint browser: true nomen: true devel: true vars: true */
/*global jQuery, _ */

/*!
 * waveform
 * part of edible in-browser media timeline
 * Author: Steve Rubin
 */
 
 
(function ($, window, document, undefined) {
    "use strict";
    $.widget("edible.waveform", {
        options: {
            bgColor: "blue",
            height: "90px",
            canvHeight: "75px",
            topBarHeight: "15px",
            dur: 1000,       // millseconds, doesn't change
            len: 1000,       // milliseconds, visible length from start
            start: 0,        // milliseconds
            pxPerMs: .1,
            name: "audio"
        },
        
        // public
        width: function () {
            return this.options.len * this.options.pxPerMs;
        },
        
        debugInfo: function () {
            return JSON.stringify(this.options, null, 4);
        },
        
        // private 
        _create: function () {
            var that = this;
            var wfTemplate = $("#waveformTemplate").html();
            var $canv;
            var $topBar;
            this.element.addClass('edible-waveform');
            this.element.append(_.template(wfTemplate, this.options));
            $canv = this.element.find('.displayCanvas');
            $topBar = this.element.find('.topBar');
            
            // TODO: don't hardcode the snap tolerance
            this.element.draggable({
                handle: $topBar,
                snap2: ".track",
                snap2Mode: "inner",
                snap2Tolerance: 46,
                snap2Sides: "tb",
                stack: ".edible-waveform"
            }).resizable({
                handles: "e, w",
                stop: function (event, ui) {
                    console.log("ui", ui);
                    var leftDiff = ui.position.left - ui.originalPosition.left;
                    // hypothetical position of start of waveform
                    var startLeft = ui.originalPosition.left -
                        that.options.start * that.options.pxPerMs;

                    var maxWidth = that.options.dur * that.options.pxPerMs;
                    var start = that.options.start;
                    var len = ui.size.width / that.options.pxPerMs;
                    var left = ui.position.left;
                    
                    if (leftDiff !== 0) {
                        // left handle
                        start = that.options.start +
                            leftDiff / that.options.pxPerMs;
                        // handle pulled past hypothetical start
                        if (start < 0) {
                            start = 0;
                            left = startLeft;
                            len = that.options.len + that.options.start;
                        }
                    } else {
                        // right handle
                        // handle pulled past hypothetical end
                        if (ui.size.width > maxWidth) {
                            len = that.options.dur;
                        }
                    }

                    console.log("orig element offset", ui.originalElement.offset());
                    that.element.css("left",
                        left - that.element.parent().offset().left);
                    that._setOptions({
                        len: len,
                        start: start
                    });
                    
                },
                helper: "resizable-helper"
            }).disableSelection().css("position", "absolute");
            
            this._refresh();
        },
        
        _refresh: function () {
            console.log("_refresh-ing");
            this.element.find(".displayCanvas")
                .css("background-color", this.options.bgColor)
                .attr("width", this.width())
                .attr("height", this.options.canvHeight);
            this.element.find(".topBar")
                .css("width", this.width());
            this.element.width(this.width())
                .height(this.options.height);
        },
        
        _destroy: function () {
            
        },
        
        _setOptions: function () {
            // _super and _superApply handle keeping the right this-context
            this._superApply(arguments);
            this._refresh();
        },
        
        _setOption: function (key, value) {
            console.log("in _setOption with key:", key, "value:", value);
            switch (key) {
            case "oogielove":
                break;
            default:
                this.options[key] = value;
                break;
            }
            
            this._super("_setOption", key, value);
            this._trigger("changed", null, this.debugInfo());
        }
        
    });

}(jQuery, window, document));
