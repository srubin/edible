/*jslint browser: true nomen: true devel: true vars: true */
/*global jQuery, _ */

/*!
 * waveform
 * part of edible in-browser media timeline
 * Author: Steve Rubin
 */
 
 
 // uses waveform.js from waveformjs.org
 // ...maybe

(function ($, window, document, undefined) {
    "use strict";
    $.widget("edible.waveform", $.edible.wfBase, {
        options: {
            data: [],
            height: "90px",
            canvHeight: "75px",
            topBarHeight: "15px",
            dur: 1000.0,       // millseconds, doesn't change
            len: 1000.0,       // milliseconds, visible length from start
            start: 0.0,        // milliseconds
            pxPerMs: .1,
            name: "audio",
            filename: "audio.mp3"
        },
        
        // public
        width: function () {
            return this.options.len * this.options.pxPerMs;
        },
        
        waveformClass: function () {
            return "waveform";
        },
        
        exportExtras: function () {
            return {};
        },
        
        debugInfo: function () {
            return JSON.stringify(this.options, null, 4);
        },
        
        slice: function (event) {
            // create a copy of this waveform
            var offset = this.element.offset(); 
            var relX = event.pageX - offset.left;
            var newWaveform = document.createElement('div');
            var msOfClick = relX / this.options.pxPerMs;

            // initialize the new waveform
            var $nwf = $(newWaveform)[this.waveformClass()](
                $.extend(true, {},
                    this.options, {
                        start: this.options.start + msOfClick,
                        len: this.options.len - msOfClick
                    })
                );

            this._setOptions({
                len: relX / this.options.pxPerMs
            });
            return {
                waveform: newWaveform,
                pos: relX / this.options.pxPerMs
            };
        },
        
        // private 
        _create: function () {
            // for polymorphism!
            this._super("_create");

            var that = this;
            var wfTemplate = $("#waveformTemplate").html();
            var $canv;
            var $topBar;
            this.element.addClass('edible-waveform')
                .append(_.template(wfTemplate, this.options));

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

                    var maxWidth = (that.options.dur - that.options.start) *
                        that.options.pxPerMs;
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
                            len = that.options.dur - that.options.start;
                        }
                    }

                    console.log("orig element offset", ui.originalElement.offset());
                    that.element.css("left",
                        left - that.element.parent().offset().left);
                    console.log("setting new len", len, "and start", start);
                    that._setOptions({
                        len: len,
                        start: start
                    });
                    
                },
                helper: "resizable-helper"
            }).disableSelection().css("position", "absolute");
            
            this._refresh();
        },
        
        /*
         _drawWaveform will update the displayCanvas with the current waveform
         */
        _drawWaveform: function () {
            var nsamples = this.options.data.length;
            var sampPerMs = nsamples / this.options.dur;
            var startSample = this.options.start * sampPerMs;
            var endSample = startSample + this.options.len * sampPerMs;
            
            var canv = this.element.find('.displayCanvas')[0];
            var gradient = "#4BF2A7";
            if (canv !== undefined) {
                gradient = canv.getContext('2d')
                    .createLinearGradient(0, 0, 0, parseInt(this.options.canvHeight));
                gradient.addColorStop(0.0, "#4BF2A7" );
                gradient.addColorStop(1.0, "#32CD32" );
            }

            var wf = new Waveform({
                canvas: canv,
                data: this.options.data.slice(startSample, endSample),
                innerColor: gradient,
                outerColor: "#333",
                height: this.options.canvHeight,
                interpolate: true,
                width: this.width()
            });
        },
        
        _refresh: function () {
            // console.log("_refresh-ing");
            this.element.find(".displayCanvas")
                .attr("width", this.width())
                .attr("height", this.options.canvHeight);
            this.element.find(".topBar")
                .css("width", this.width());
            this.element.width(this.width())
                .height(this.options.height);
            this._drawWaveform();
        },
        
        _destroy: function () {
            this._super("destroy");
        },
        
        _setOptions: function () {
            // _super and _superApply handle keeping the right this-context
            this._superApply(arguments);
            this._refresh();
            console.log("triggering changed");
            this._trigger("changed", null, arguments);
        },
        
        _setOption: function (key, value) {
            // console.log("in _setOption with key:", key, "value:", value);
            switch (key) {
            case "oogielove":
                break;
            default:
                this.options[key] = value;
                break;
            }
            
            this._super("_setOption", key, value);
        }
        
    });

}(jQuery, window, document));
